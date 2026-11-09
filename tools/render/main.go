// Command render scaffolds the registry's templates the way `np package init`
// does, with no network and no prompt: what CI runs to test every template
// as a tenant gets it.
//
//	cd tools/render
//	go run . -registry ../.. -out /tmp/scaffolds                                    # every template, into <out>/<id>
//	go run . -registry ../.. -template collector-bun -name "My Collector" -out /tmp/my-collector
//	go run . -registry ../.. -list                                                  # the template ids, as JSON
//
// It renders as the CLI does (cli/cmd/pkg/init): Go text/template with
// missingkey=error, the variables Name, Slug, User, Version and each variable
// of the template's category (its default; -var overrides one), `__SLUG__`
// path segments renamed to the slug, files under `.github/` and `scripts/`
// copied verbatim, the executable bit kept. It also renders each template's
// post_init and next_steps, and refuses a registry the CLI would refuse or
// could not scaffold without asking: a template with no id, an id given
// twice, a variable with no default.
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"text/template"

	"gopkg.in/yaml.v3"
)

type variable struct {
	Name    string `yaml:"name"`
	Default string `yaml:"default"`
}

type category struct {
	Type      string     `yaml:"type"`
	Variables []variable `yaml:"variables"`
}

type entry struct {
	ID        string   `yaml:"id"`
	Path      string   `yaml:"path"`
	Type      string   `yaml:"type"`
	SDK       string   `yaml:"sdk"`
	PostInit  []string `yaml:"post_init"`
	NextSteps []string `yaml:"next_steps"`
}

type registry struct {
	Categories []category `yaml:"categories"`
	Templates  []entry    `yaml:"templates"`
}

// verbatim are the template subtrees the CLI copies without rendering.
var verbatim = []string{".github/", "scripts/"}

// builtIn are the variables the CLI derives; a category never declares them.
var builtIn = map[string]bool{"Slug": true, "User": true, "Version": true}

var identifier = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

type overrides map[string]string

func (o overrides) String() string { return fmt.Sprint(map[string]string(o)) }

func (o overrides) Set(value string) error {
	name, val, ok := strings.Cut(value, "=")
	if !ok || name == "" {
		return fmt.Errorf("-var takes Name=value, not %q", value)
	}
	o[name] = val
	return nil
}

func main() {
	root := flag.String("registry", ".", "the registry checkout: manifest.yaml and templates/")
	id := flag.String("template", "", "the template id to render; every template when empty")
	name := flag.String("name", "Example Package", "the package's name, as `np package init --name` takes it")
	out := flag.String("out", "", "where to render: the scaffold's directory with -template, else the parent of one directory per template id")
	vars := overrides{}
	flag.Var(vars, "var", "a category variable's value, Name=value (repeatable); its default otherwise")
	list := flag.Bool("list", false, "print the registry's template ids as a JSON array (a CI matrix) and render nothing")
	flag.Parse()
	if *list {
		if err := listIDs(*root); err != nil {
			fmt.Fprintln(os.Stderr, "render:", err)
			os.Exit(1)
		}
		return
	}
	if err := run(*root, *id, *name, *out, vars); err != nil {
		fmt.Fprintln(os.Stderr, "render:", err)
		os.Exit(1)
	}
}

func run(root, id, name, out string, given overrides) error {
	if out == "" {
		return errors.New("-out is required")
	}
	reg, err := load(filepath.Join(root, "manifest.yaml"))
	if err != nil {
		return err
	}
	slug := slugify(name)
	if slug == "" {
		return fmt.Errorf("name %q makes no slug", name)
	}
	for _, t := range reg.Templates {
		if id != "" && t.ID != id {
			continue
		}
		dest := out
		if id == "" {
			dest = filepath.Join(out, t.ID)
		}
		v := map[string]any{"Name": name, "Slug": slug, "User": "ci", "Version": "0.0.1"}
		for _, declared := range reg.variablesOf(t) {
			v[declared.Name] = declared.Default
		}
		for k, val := range given {
			v[k] = val
		}
		if err := scaffold(filepath.Join(root, "templates", t.Path), dest, v); err != nil {
			return fmt.Errorf("template %s: %w", t.ID, err)
		}
		for _, line := range append(append([]string{}, t.PostInit...), t.NextSteps...) {
			if _, err := render("post_init/next_steps", line, v); err != nil {
				return fmt.Errorf("template %s: %w", t.ID, err)
			}
		}
		fmt.Println(dest)
		if id != "" {
			return nil
		}
	}
	if id != "" {
		return fmt.Errorf("no template %q in the registry", id)
	}
	return nil
}

// listIDs prints the ids of a registry that loads, in its order.
func listIDs(root string) error {
	reg, err := load(filepath.Join(root, "manifest.yaml"))
	if err != nil {
		return err
	}
	ids := make([]string, 0, len(reg.Templates))
	for _, t := range reg.Templates {
		ids = append(ids, t.ID)
	}
	return json.NewEncoder(os.Stdout).Encode(ids)
}

// load reads the registry and refuses what the CLI refuses, and a variable a
// scripted init would have to ask for.
func load(path string) (*registry, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var reg registry
	if err := yaml.Unmarshal(raw, &reg); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	seen := map[string]bool{}
	for _, t := range reg.Templates {
		switch {
		case t.ID == "":
			return nil, fmt.Errorf("%s: a template (path %q) has no id", path, t.Path)
		case seen[t.ID]:
			return nil, fmt.Errorf("%s: template id %q is given twice", path, t.ID)
		case reg.category(t.Type) == nil:
			return nil, fmt.Errorf("%s: template %q is of type %q, which no category declares", path, t.ID, t.Type)
		}
		seen[t.ID] = true
	}
	for _, c := range reg.Categories {
		for _, v := range c.Variables {
			switch {
			case !identifier.MatchString(v.Name):
				return nil, fmt.Errorf("%s: category %q: variable %q is no name a template can use", path, c.Type, v.Name)
			case builtIn[v.Name]:
				return nil, fmt.Errorf("%s: category %q: variable %q is built in", path, c.Type, v.Name)
			case v.Name != "Name" && v.Default == "":
				return nil, fmt.Errorf("%s: category %q: variable %q has no default: a scripted init would have to ask for it", path, c.Type, v.Name)
			}
		}
	}
	return &reg, nil
}

func (r *registry) category(kind string) *category {
	for i := range r.Categories {
		if r.Categories[i].Type == kind {
			return &r.Categories[i]
		}
	}
	return nil
}

// variablesOf are the variables of t's category beside the built-in Name.
func (r *registry) variablesOf(t entry) []variable {
	var out []variable
	for _, v := range r.category(t.Type).Variables {
		if v.Name != "Name" {
			out = append(out, v)
		}
	}
	return out
}

func scaffold(src, dest string, v map[string]any) error {
	if _, err := os.Stat(dest); err == nil {
		return fmt.Errorf("%s already exists", dest)
	}
	return filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		raw, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		content := string(raw)
		if !isVerbatim(rel) {
			if content, err = render(rel, content, v); err != nil {
				return err
			}
		}
		target := filepath.Join(dest, strings.ReplaceAll(rel, "__SLUG__", v["Slug"].(string)))
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		return os.WriteFile(target, []byte(content), modeOf(path, rel))
	})
}

func isVerbatim(rel string) bool {
	rel = filepath.ToSlash(rel)
	for _, dir := range verbatim {
		if strings.HasPrefix(rel, dir) {
			return true
		}
	}
	return false
}

func render(name, content string, v map[string]any) (string, error) {
	t, err := template.New(name).Option("missingkey=error").Parse(content)
	if err != nil {
		return "", fmt.Errorf("parse %s: %w", name, err)
	}
	var b strings.Builder
	if err := t.Execute(&b, v); err != nil {
		return "", fmt.Errorf("render %s: %w", name, err)
	}
	return b.String(), nil
}

// modeOf keeps the template's executable bit; a script or an entrypoint is
// executable whatever its mode.
func modeOf(path, rel string) os.FileMode {
	if info, err := os.Stat(path); err == nil && info.Mode()&0o111 != 0 {
		return 0o755
	}
	base := filepath.Base(rel)
	if base == "entrypoint" || strings.HasPrefix(filepath.ToSlash(rel), "bin/") || strings.HasSuffix(base, ".sh") {
		return 0o755
	}
	return 0o644
}

// slugify is the CLI's: lowercase alphanumerics joined by single dashes.
func slugify(s string) string {
	var b strings.Builder
	dash := false
	for _, r := range strings.ToLower(strings.TrimSpace(s)) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			dash = false
		} else if !dash {
			b.WriteByte('-')
			dash = true
		}
	}
	return strings.Trim(b.String(), "-")
}
