<h2 align="center">
    <a href="https://nullplatform.com" target="blank_">
        <img height="100" alt="Nullplatform" src="https://nullplatform.com/favicon/android-chrome-192x192.png" />
    </a>
    <br>
    <br>
    Plugin Templates by nullplatform
    <br>
</h2>

Template registry for `np package init`. Each template is a complete package scaffold — SDK code on [`@nullplatform/plugin`](https://www.npmjs.com/package/@nullplatform/plugin), its tests and fixtures, a self-contained multi-stage `Dockerfile`, `mise` tasks (test/local/dev/build/run/publish), a release workflow, and docs (`README.md` + `AGENTS.md` for humans and AI coding tools) — rendered with Go `text/template`.

```bash
np package init --name my-scope --template scope-bun
cd my-scope && np package run     # dockerized agent spawns the worker locally
```

## Layout

```
plugin-templates/
├── manifest.yaml              # registry: categories, SDKs, templates + variables
├── templates/
│   └── <sdk>/
│       └── <template dir>/
│           └── ...            # template files, rendered with {{ .Var }}
└── tools/render/              # renders templates as `np package init` does: what CI tests
```

## Available templates

| Template id | Category | SDK | Description |
|---|---|---|---|
| `scope-bun` | scope | bun | Deployment target plugin (Kubernetes, Lambda, ECS, ...) |
| `simple-bun` | simple | bun | Custom command handler (health checks, migrations, ...) |
| `service-bun` | service | bun | Application dependency plugin (databases, caches, ...) |
| `collector-bun` | collector | bun | Catalog collector of a system of record of your own (GitHub, CMDB, an export, ...): its specifications, source type and mappings published with it |
| `collector-kubernetes-bun` | collector | bun | nullplatform's Kubernetes collector as your own package, ready to extend |

`np package init --template <id>` scaffolds one; several templates may share a
category and SDK.

## Adding a template

1. Create a directory under `templates/<sdk>/<name>/` with the source files
2. Use `{{ .Name }}` and `{{ .Slug }}` in file contents and `__SLUG__` in file paths (everything else — scope category/provider, channel routing/sources, a collector's source — is declared in code via the SDK, the single source of truth). Every file is a Go `text/template` (a literal `{{` is `{{"{{"}}`) except under `.github/` and `scripts/`, copied verbatim. `{{ .Name }}` is what the user typed: keep it out of code, or render it as a quoted string (`{{ printf "%q" .Name }}`), so a quote in it cannot break the scaffold
3. Register it in `manifest.yaml` under `templates:` with a unique `id` (what `--template` names), a `name` and `description` that tell it apart from the other templates of its category in the picker, and its `type` (a category) and `sdk`. Several templates may share a category and SDK; list the category's general one first (older CLIs pick the first of a pair)
4. Build on the released SDK (`@nullplatform/plugin`, `^0.5.0`), and only on released versions of every dependency: a definition file (`defineScope`, `defineService`, `definePlugin` or `defineCollector`) with its package loaded from the template's `package.json`; `src/index.ts`, `await main(plugin)`, what the agent or the image runs; `src/local.ts`, the same with in-memory ports (`recordingPlatform().fetch`, `noopTracing`, a collector's `InMemoryIngest`) — no environment variable switches a run to local
5. Test it in-process with `run` from `@nullplatform/plugin/testing`, against the template's own fixtures (`test/fixtures/`); `package.json` has the `test`, `typecheck` and `describe` scripts CI runs
6. A variable a category declares beside `Name` is asked for and rendered as `{{ .<Variable> }}`; give it a `default`, so a scripted `np package init --name … --template …` (and CI) never has to ask
7. Include a `README.md` and an `AGENTS.md` — every scaffold ships docs for people and for AI assistants (Claude Code, Cursor, …); a template that publishes or deploys something walks through every step, copy-pasteable

CI (`.github/workflows/templates.yml`) renders every template of `manifest.yaml`
with `tools/render` — Go's `text/template`, as `np package init` renders —
and runs its `test`, `typecheck` and `describe`:

```bash
cd tools/render && go run . -registry ../.. -out /tmp/scaffolds                # every template, into /tmp/scaffolds/<id>
cd tools/render && go run . -registry ../.. -template collector-bun -name "My Collector" -out /tmp/my-collector
```

SDKs are not limited to TypeScript/bun: a template owns its whole build via `mise.toml` + its `Dockerfile`, so a Go or Python SDK template plugs in the same way.
