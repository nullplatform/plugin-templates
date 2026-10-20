# {{ .Name }}

A nullplatform **command handler** as a package: one `execute()` component
from `@nullplatform/plugin/package` answers any document the agent hands over.
Compiled to one binary and run as the worker the controlplane agent spawns.

Use it for anything that isn't a scope or a service: health checks,
migrations, notifications, data sync — and live reads. A caller (the console,
a UI plugin, a workflow) sends `POST /controlplane/agent_command` with the
package and a document; what `execute()` returns comes back **in the same
response**, so a `list` or `get` answers with real data, no catalog involved.

## What to edit

| File | What it is |
|---|---|
| `src/handler.ts` | `handle(ctx)`: reads the document (`ctx.payload`), dispatches on `action`, returns the answer |
| `src/package.ts` | `definePackage({ components: [execute(handle)] })` and the tracer |
| `src/main.ts` | `--describe` (identity and agent routing for `np package publish`), else `pkg.start()` |
| `test/` | one `pkg.execute(document)` per command: status, data, error, steps |

## Develop

```bash
mise run test        # every command in-process, no platform
mise run typecheck
mise run describe    # the manifest np package publish reads
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
