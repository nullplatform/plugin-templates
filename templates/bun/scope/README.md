# {{ .Name }}

A nullplatform **scope** — a place the platform deploys applications to — as a
**package**. The scope, its scope type, every lifecycle action and its plan are
declared in code with `@nullplatform/plugin`, each action is a TypeScript
function, and one `np package publish` registers all of it.

Creating a scope provisions nothing for the workload: that happens on the
deployment actions.

## What to edit

| File | What it is |
|---|---|
| `src/schema.ts` | the attributes: the inputs the user sets (in `required`, with defaults) and the outputs a deployment reports |
| `src/resources.ts` | the scope, its scope type, the handler of every action and each action's **plan** (stages + steps) |
| `src/scope.ts` | `create-scope` / `delete-scope`: the target's footprint |
| `src/deployment.ts` | `start-initial` / `start-blue-green` / `switch-traffic` / `finalize-blue-green` / `rollback-deployment` / `delete-deployment` |
| `src/logs.ts` | `log:read`: the workload's logs, as data |
| `src/package.ts` | `definePackage` and the tracer (name, version and description come from `package.json`) |
| `test/` | one `pkg.run()` per action: status, steps, results, traffic |

The body of every `ctx.step(...)` is a placeholder for your infrastructure.

## Develop

```bash
mise run test        # every action in-process, no platform
mise run typecheck
mise run describe    # the manifest np package publish sends
np package dev       # browser dev UI: pick an action, edit the notification, run it
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
