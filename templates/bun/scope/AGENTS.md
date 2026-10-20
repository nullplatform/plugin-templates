# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **package**: the scope `{{ .Slug }}` (a deployment target) and
its scope type, declared as one value with `@nullplatform/plugin/package`,
with one handler function per action. `src/main.ts` is `pkg.start()`:
`--describe` prints the manifest, an action in `NP_ACTION_CONTEXT` runs once,
otherwise the gRPC server serves the agent. `Dockerfile` compiles it to one
binary.

## File map

```
src/schema.ts      the attributes schema, the console form (uiSchema), the Context type
src/resources.ts   scope({ …, scopeType, telemetry, plans, actions }): everything published
src/scope.ts       create-scope / delete-scope
src/deployment.ts  start-initial / start-blue-green / switch-traffic / finalize-blue-green / rollback-deployment / delete-deployment
src/logs.ts        log:read
src/package.ts     definePackage({ name, version, description, components, tracing })
src/main.ts        pkg.start()
test/*.test.ts     pkg.run(resource, action, input, context)
Dockerfile         worker image, non-root; entrypoint /app/packages/{{ .Slug }}/entrypoint
mise.toml          describe · test · typecheck · build · dev · build:image · run · publish:image
```

## Rules

- **Declarations use the service API's own fields, in camelCase.** `scope()`
  takes what `POST /service_specification` takes (`assignableTo`,
  `selectors.subCategory`, …) plus `actions`, `scopeType`, `telemetry`,
  `assetType` and `plans`. The JSON schema travels verbatim: property names and
  keywords (`visibleOn`, `editableOn`, `order`, `readOnly`) are never converted.
- **The console form is `required`.** The scope form shows exactly the
  properties listed in `schema.required`, laid out by `uiSchema`. Give every
  input a default.
- **Results must fit the schema.** A deployment action returns only the
  schema's read-only outputs (`visibleOn: ["read"]`); the platform rejects
  anything else and the action never completes. Return nothing when there is
  nothing to report.
- **Every action has a plan, in stages.** `plans` in `resources.ts` names the
  steps each action runs, grouped into stages with titles. Step keys are the
  exact `ctx.step` names. The console's deployment timeline shows one station
  per stage, and a flat plan (no groups) leaves the page on the plain view.
- **Steps tell what happened.** `ctx.step(name, (step) => …)`: call
  `step.explain({ what, why })` with the facts (what was created, where it
  answers), `step.link(...)` for somewhere to go, `step.output(name, value)`
  for data worth keeping. `ctx.trace.explain(...)` is the run's own one-line
  story. All silent when tracing is off.
- **A scope provisions nothing on create.** `create-scope` builds the target's
  footprint; the workload lands on the deployment actions.
- **Traffic is reported, not returned.** `switch-traffic` calls
  `ctx.deployment.reportTraffic(ctx.weight)`; the platform sends the weight as
  `desired_traffic` and does not read it off the results.
- **Data actions return exactly their shape.** `log:read` returns
  `{ results: [{ message, datetime }] }` and nothing else.
- **`ctx.params` is the input**: the scope's attributes merged with the
  action's parameters. `ctx.scopeId`, `ctx.deploymentId`, `ctx.assetUrl` and
  `ctx.weight` are the platform-owned values, already mapped.
- **Fail with a name.** `throw new ActionError("CODE", message)`;
  `ActionError.retry(...)` when the platform may try again. Any other throw is
  reported as `EXECUTION_ERROR`.
- **No `console.log` inside a handler** — `ctx.log.*` is the action's live log,
  and a data action's stdout is its answer.
- **Tests are `pkg.run`.** `await pkg.run(target, Actions.START_INITIAL, { scope_id, deployment_id }, { scope, service })`
  returns `{ status, results, data, error, logs, steps, traffic }`.
- **Handlers are idempotent.** The platform retries; a second run must find the
  work done and succeed.
- **The tracer is built in `package.ts`.** A compiled worker cannot resolve the
  SDK's lazy import of `@nullplatform/tracing`; keep the static import.
- Never set `NP_MODE=dev` in the image: it switches the SDK to the in-memory
  platform client and the worker never reports lifecycle.

## Verify

```bash
mise run test
mise run typecheck
mise run describe
```
