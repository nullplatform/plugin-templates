# {{ .Name }}

A nullplatform **dependency service** — something applications need to run: a
database, a cache, a queue — as a **package**. The service and its `connect`
link are declared in code with `@nullplatform/plugin`, every action is a
TypeScript function, and one `np package publish` registers all of it.

## What to edit

| File | What it is |
|---|---|
| `src/resources.ts` | the service and its link: name, selectors, the attributes the platform renders |
| `src/service.ts` | `create` / `update` / `delete` of the service |
| `src/connect.ts` | `create` / `update` / `delete` of the `connect` link: what a linked application receives |
| `src/package.ts` | `definePackage`: resources + handlers (name, version and description come from `package.json`) |
| `test/` | one `pkg.run()` per action: status, results, steps, logs |

The placeholders are the `size` input and the `endpoint` output of the service,
the `connection_url` the link exports, and the body of every `ctx.step(...)`.

## Develop

```bash
mise run test        # every action in-process, no platform
mise run describe    # the manifest np package publish sends
np package dev       # browser dev UI: pick an action, edit the notification, run it
```

## Run and publish

```bash
export NP_API_KEY=...
np package run                                       # a real agent on this machine, tagged local:<you>, spawns the worker image
np package publish --nrn organization=…:account=…   # build + push the image, register the service and its link
```

Cutting a GitHub Release runs `.github/workflows/release.yml`, which publishes
from CI (secret `NULLPLATFORM_API_KEY`, variable `NP_NRN`).

New to the code? Read `AGENTS.md`.
