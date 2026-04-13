<h2 align="center">
    <a href="https://nullplatform.com" target="blank_">
        <img height="100" alt="Nullplatform" src="https://nullplatform.com/favicon/android-chrome-192x192.png" />
    </a>
    <br>
    <br>
    Plugin Templates by nullplatform
    <br>
</h2>

Template registry for `np plugin init`. Each template is a complete plugin scaffold rendered with Go `text/template`.

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

1. Create a directory under `templates/<sdk>/<category>/` with the source files
2. Use `{{ .Name }}`, `{{ .Slug }}`, `{{ .Category }}`, `{{ .Provider }}` in file contents and names
3. Register it in `manifest.yaml` under `templates:` with the matching `type` and `sdk`
4. Add any new variables to the category definition in `manifest.yaml`
