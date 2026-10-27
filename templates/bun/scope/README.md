# {{ .Name }}

A nullplatform **scope** — a place the platform deploys applications to — as a
**package**. The scope, its scope type, every lifecycle action and its plan are
declared in code with `defineScope` from `@nullplatform/plugin/scope`, each
action is a TypeScript function, and one `np package publish` registers all of
it.

Creating a scope provisions nothing for the workload: that happens on the
deployment actions.

## What to edit

| File | What it is |
|---|---|
| `src/schema.ts` | the specification: its selectors, the attributes (the inputs the user sets, in `required` with defaults, and the outputs a deployment reports) and the console form |
| `src/scope.ts` | `defineScope`: the package (from `package.json`), the scope type and the handler of every action |
| `src/plans.ts` | each action's title, description and **plan** (stages + steps) on the console's timeline |
| `src/target.ts` | `create-scope` / `delete-scope`: the target's footprint |
| `src/deployment.ts` | `start-initial` / `start-blue-green` / `switch-traffic` / `finalize-blue-green` / `rollback-deployment` / `delete-deployment` |
| `src/logs.ts` | `log:read`: the workload's logs, as data |
| `src/index.ts` | what the agent runs: `await main(scope)` |
| `src/local.ts` | the same, with in-memory ports: nothing reaches the platform |
| `test/` | one `run()` per action against the documents in `test/fixtures/`: steps, results, the platform's requests |

The body of every `context.trace.step(...)` is a placeholder for your infrastructure.

## Develop

```bash
mise run test                                       # every action in-process, no platform
mise run typecheck
mise run describe                                   # the manifest np package publish sends
mise run local                                      # answer test/fixtures/create-scope.json locally
mise run local test/fixtures/start-initial.json     # …or any other document
np package dev                                      # browser dev UI: pick a run, edit the document, run it
```

## Run and publish

```bash
export NP_API_KEY=...
np package run                                       # a real agent on this machine, tagged local:<you>, spawns the worker image
np package publish --nrn organization=…:account=…   # build + push the image, register the scope type and its actions
```

Then create a scope of this type in the console and deploy to it: while
`np package run` is up, the actions run on your machine, and each deployment's
page shows the plan's stages with what every step said. Cutting a GitHub
Release runs `.github/workflows/release.yml`, which publishes from CI (secret
`NULLPLATFORM_API_KEY`, variable `NP_NRN`).

New to the code? Read `AGENTS.md`.
