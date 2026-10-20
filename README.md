<h2 align="center">
    <a href="https://nullplatform.com" target="blank_">
        <img height="100" alt="Nullplatform" src="https://nullplatform.com/favicon/android-chrome-192x192.png" />
    </a>
    <br>
    <br>
    Plugin Templates by nullplatform
    <br>
</h2>

Template registry for `np package init`. Each template is a complete package scaffold — SDK code, a self-contained multi-stage worker `Dockerfile`, `mise` tasks (dev/test/build/run/publish), a release workflow, and docs (`README.md` + `AGENTS.md` for humans and AI coding tools) — rendered with Go `text/template`.

```bash
np package init --name my-scope --template scope-bun
cd my-scope && np package run     # dockerized agent spawns the worker locally
```

## Layout

```
plugin-templates/
├── manifest.yaml              # registry: categories, SDKs, templates + variables
└── templates/
    └── <sdk>/
        └── <category>/
            └── ...            # template files, rendered with {{ .Var }}
```

## Available templates

| Category | SDK | Description |
|---|---|---|
| scope | bun | Deployment target plugin (Kubernetes, Lambda, ECS, ...) |
| simple | bun | Custom command handler (health checks, migrations, ...) |
| service | bun | Application dependency plugin (databases, caches, ...) |

## Adding a template

1. Create `templates/<sdk>/<category>/` with the source files. Use `{{ .Name }}` and `{{ .Slug }}` in file contents and `__SLUG__` in file paths.
2. Register it in `manifest.yaml` under `templates:` with its `type` and `sdk`, and add any new variables to its category.
3. Pin the released SDK to an exact version.
4. Include a `README.md` and an `AGENTS.md`.

SDKs are not limited to TypeScript/bun: a template owns its whole build via `mise.toml` + its `Dockerfile`, so a Go or Python SDK template plugs in the same way.
