# {{ .Name }}

A nullplatform **command handler** as a package: one `execute()` route from
`@nullplatform/plugin` answers any document the agent hands over.
Compiled to one binary and run as the worker the controlplane agent spawns.

Use it for anything that isn't a scope or a service: health checks,
migrations, notifications, data sync — and live reads. A caller (the console,
a UI plugin, a workflow) sends `POST /controlplane/agent_command` with the
package and a document; what `execute()` returns comes back **in the same
response**, so a `list` or `get` answers with real data, no catalog involved.

## What to edit

| File | What it is |
|---|---|
| `src/handler.ts` | `handle(payload, context)`: reads the document, dispatches on `action`, returns the answer |
| `src/plugin.ts` | `definePlugin({ package, routes: [execute(handle)] })`, the package from `package.json` |
| `src/index.ts` | what the agent runs: `await main(plugin)` |
| `src/local.ts` | the same, with in-memory ports: nothing reaches the platform |
| `test/` | one `run(plugin, document)` per command: data, failure, steps |

## Develop

```bash
mise run test                              # every command in-process, no platform
mise run typecheck
mise run describe                          # the manifest np package publish reads
mise run local                             # answer test/fixtures/hello.json locally
mise run local path/to/your-document.json  # …or any other document
```

## Call it

```bash
curl -X POST https://api.nullplatform.com/controlplane/agent_command \
  -H "Authorization: Bearer $NP_TOKEN" -H 'content-type: application/json' \
  -d '{"nrn":"organization=…","selector":{"package":"{{ .Slug }}"},
       "command":{"type":"package-exec","data":{"package":"{{ .Slug }}",
         "environment":{"NP_ACTION_CONTEXT":"{\"action\":\"hello\",\"name\":\"Ada\"}"}}}}'
```

## Run and publish

```bash
export NP_API_KEY=...
np package run                                       # a real agent on this machine, tagged local:<you>, spawns the worker image
np package publish --nrn organization=…:account=…   # build + push the image, register the package
```

Cutting a GitHub Release runs `.github/workflows/release.yml`, which publishes
from CI (secret `NULLPLATFORM_API_KEY`, variable `NP_NRN`).

New to the code? Read `AGENTS.md`.
