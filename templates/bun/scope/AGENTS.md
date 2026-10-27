# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **package**: the scope `{{ .Slug }}` (a deployment target) and
its scope type, defined with `defineScope` from `@nullplatform/plugin/scope`,
with one handler function per action. Nothing runs on import: `src/index.ts` is
`await main(scope)` — `--describe` prints the manifest, a document in
`NP_ACTION_CONTEXT` is answered once, otherwise it serves the agent's gRPC
protocol until SIGTERM. `src/local.ts` is the same with in-memory ports.
`Dockerfile` compiles `src/index.ts` to one binary.

## File map

```
src/schema.ts       the specification: selectors, attributes schema, console form (uiSchema), handler input types
src/scope.ts        defineScope({ package, specification, assetType, scopeType, actions })
src/plans.ts        each action's title, description and plan (stages + steps)
src/target.ts       create-scope / delete-scope
src/deployment.ts   start-initial / start-blue-green / switch-traffic / finalize-blue-green / rollback-deployment / delete-deployment
src/logs.ts         log:read
src/index.ts        await main(scope): the real ports
src/local.ts        await main(scope, { fetch: recordingPlatform().fetch, tracing: noopTracing })
test/fixtures/      the documents the platform sends each action, as the agent delivers them
test/*.test.ts      run(scope, fixture.notification, { with }) from @nullplatform/plugin/testing
Dockerfile          worker image, non-root; entrypoint /app/packages/{{ .Slug }}/entrypoint
mise.toml           describe · test · typecheck · build · local · dev · build:image · run · publish:image
```

## Rules

- **The specification is the API's body, as written.** `specification` is what
  `POST /service_specification` takes (`selectors`, `attributes`, …), in the
  API's own snake_case; nothing converts it. The package (name, version,
  description) comes from `package.json`, and names the specification.
- **Schema keys are snake_case.** The platform snake-cases every key it sends a
  plugin, so `defineScope` refuses a property it would rename
  (`replicaCount` arrives as `replica_count`: name it so).
- **The console form is `required`.** The scope form shows exactly the
  properties listed in `schema.required`, laid out by `schema.uiSchema`. Give
  every input a default.
- **Results are attributes.** A lifecycle action returns the attributes it
  changed (`Partial` of the schema's); the platform copies the ones the schema
  declares into the scope. Return `{}` when there is nothing to report.
- **Every action has a plan, in stages.** `narration` in `plans.ts` names the
  steps each action runs, grouped into stages with titles. Step keys
  (letters, digits, `-`, `_`, `.`) are the exact `context.trace.step` names.
  The console's deployment timeline shows one station per stage.
- **A handler is `(input, context)`.** `input` is what the platform sent:
  `input.parameters` (the action's own: `scope_id`, `deployment_id`,
  `desired_traffic`), `input.scope`, `input.deployment` (always there on a
  deployment action), `input.service.attributes` (the scope's attributes as
  stored, `asset_url` among them). `context` is the SDK's tools: `log`,
  `trace`, `api`, `signal`, `credentials`.
- **Steps tell what happened.** `context.trace.step(key, (step) => …)`: call
  `step.explain({ what, why })` with the facts, `step.link(...)` for somewhere
  to go, `step.output(name, value)` for data worth keeping.
  `context.trace.explain(...)` is the run's own story. Silent when tracing is
  off; the step still runs.
- **A scope provisions nothing on create.** `create-scope` builds the target's
  footprint; the workload lands on the deployment actions.
- **Traffic is reported, not returned.** `switch-traffic` calls
  `context.api.deployment(id).patch({ strategy_data: { switched_traffic } })`;
  the platform does not read it off the results.
- **Telemetry actions return exactly their shape.** `log:read` returns
  `{ results: [{ message, datetime }] }` and nothing else; it has no lifecycle.
- **Fail with a name.** `throw new ActionError("CODE", message, { retryable? })`
  from `@nullplatform/plugin`. Any other throw is reported as a failure too.
- **Logs are `context.log`.** `debug`, `info`, `warn`, `error`, on stderr; on a
  lifecycle action each line at info and above is posted to the action. Never
  `console.log` in a handler: stdout is the worker's answer.
- **Tests are `run()`.** `await run(scope, startInitial.notification, { with })`
  returns `{ success, data, failure, requests, logs, steps }`; `with` lays
  fields over the document's payload.
- **Handlers are idempotent.** The platform retries; a second run must find the
  work done and succeed.
- **Local runs are an entry point, not a mode.** No environment variable makes
  a run local: `src/local.ts` passes the in-memory ports. The image runs
  `src/index.ts`.

## Verify

```bash
mise run test
mise run typecheck
mise run describe
mise run local
```
