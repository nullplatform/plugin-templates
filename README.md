# plugin-templates

Template registry for `np plugin init`. Each template is rendered with Go
`text/template` + [sprig](https://masterminds.github.io/sprig/) helpers.

## Layout

```
plugin-templates/
├── manifest.yaml              # registry: templates + variables
└── templates/
    └── <lang>/
        └── <type>/
            └── ...            # template files, rendered verbatim with {{ .Var }}
```

## Adding a template

1. Create a directory under `templates/<lang>/<type>/` with the source files
2. Reference template variables as `{{ .VarName }}` inside files
3. Register it in `manifest.yaml` with its variables + prompts
