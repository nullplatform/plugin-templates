# {{ .Name }}

A nullplatform **scope** — a place the platform deploys applications to — as a
**package**. The scope, its scope type and every lifecycle action are declared
in code with `@nullplatform/plugin`, each action is a TypeScript function, and
one `np package publish` registers all of it.

Creating a scope provisions nothing for the workload: that happens on the
deployment actions.

## What to edit

| File | What it is |
|---|---|
| `src/resources.ts` | the scope (the attributes the user sets, the actions it answers) and its scope type |
| `src/scope.ts` | `create-scope` / `delete-scope`: the target's footprint |
| `src/deployment.ts` | `start-initial` / `switch-traffic` / `finalize-blue-green` / `rollback-deployment`: where the workload lands |
| `src/logs.ts` | `log:read`: the workload's logs, as data |
| `src/package.ts` | `definePackage`: resources + handlers (name, version and description come from `package.json`) |
| `test/` | one `pkg.run()` per action: status, steps, logs, and what the platform is told |

The body of every `ctx.step(...)` is a placeholder for your infrastructure.

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
np package publish --nrn organization=…:account=…   # build + push the image, register the scope type and its actions
```

Then create a scope of this type in the console and deploy to it: while
`np package run` is up, the actions run on your machine. Cutting a GitHub
Release runs `.github/workflows/release.yml`, which publishes from CI (secret
`NULLPLATFORM_API_KEY`, variable `NP_NRN`).

New to the code? Read `AGENTS.md`.
