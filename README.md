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
| collector | bun | Catalog collector: feed the catalog from a system of record (Kubernetes, GitHub, CMDB, ...) |

## Adding a template

1. Create a directory under `templates/<sdk>/<category>/` with the source files
2. Use `{{ .Name }}` and `{{ .Slug }}` in file contents and `__SLUG__` in file paths (everything else — scope category/provider, channel routing/sources, a collector's source — is declared in code via the SDK, the single source of truth)
3. Register it in `manifest.yaml` under `templates:` with the matching `type` and `sdk`
4. Build on the released SDK (`@nullplatform/plugin`, `^0.2.0`): a definition file (`defineScope`, `defineService`, `definePlugin` or `defineCollector`) with its package loaded from the template's `package.json`; `src/index.ts`, `await main(plugin)`, what the agent or the image runs; `src/local.ts`, the same with in-memory ports (`recordingPlatform().fetch`, `noopTracing`, a collector's `InMemoryIngest`) — no environment variable switches a run to local
5. Test it in-process with `run` from `@nullplatform/plugin/testing`, against the template's own fixtures (`test/fixtures/`)
6. Add any new variables to the category definition in `manifest.yaml`
7. Include a `README.md` and an `AGENTS.md` — every scaffold ships docs for people and for AI assistants (Claude Code, Cursor, …)

SDKs are not limited to TypeScript/bun: a template owns its whole build via `mise.toml` + its `Dockerfile`, so a Go or Python SDK template plugs in the same way.
