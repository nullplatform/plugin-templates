# {{ .Name }}

A nullplatform **dependency service** — something applications need to run: a
database, a cache, a queue — as a **package**. The service and its `connect`
link are declared in code with `defineService` from
`@nullplatform/plugin/service`, every action is a TypeScript function, and one
`np package publish` registers all of it.

## What to edit

| File | What it is |
|---|---|
| `src/schema.ts` | the specifications: the service's selectors, inputs and outputs, the console form, the link's exported values |
| `src/service.ts` | `defineService`: the package (from `package.json`), the handler of every action, the `connect` link |
| `src/plans.ts` | each action's title, description and **plan** on the console's timeline |
| `src/dependency.ts` | `create` / `update` / `delete` of the service |
| `src/connect.ts` | `create` / `update` / `delete` of the `connect` link: what a linked application receives |
| `src/index.ts` | what the agent runs: `await main(service)` |
| `src/local.ts` | the same, with in-memory ports: nothing reaches the platform |
| `test/` | one `run()` per action against the documents in `test/fixtures/`: results, steps, the platform's requests |

The placeholders are the `size` input and the `endpoint` output of the service,
the `connection_url` the link exports, and the body of every
`context.trace.step(...)`.

## Develop

```bash
mise run test                                       # every action in-process, no platform
mise run typecheck
mise run describe                                   # the manifest np package publish sends
mise run local                                      # answer test/fixtures/create.json locally
mise run local test/fixtures/connect-create.json    # …or any other document
np package dev                                      # browser dev UI: pick a run, edit the document, run it
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
