# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **package**: the scope `{{ .Slug }}` (a deployment target)
and its scope type, declared as values with `@nullplatform/plugin/package`,
with one handler function per action. `src/main.ts` is `pkg.start()`:
`--describe` prints the manifest, an action in `NP_ACTION_CONTEXT` runs once,
otherwise the gRPC server serves the agent. `Dockerfile` compiles it to one
binary.

## File map

```
src/resources.ts   scope() + scopeType(): the specification and the type, as values
src/scope.ts       create-scope / delete-scope
src/deployment.ts  start-initial / switch-traffic / finalize-blue-green / rollback-deployment
src/logs.ts        log:read
src/package.ts     definePackage({ name, version, description, resources, handlers })
src/main.ts        pkg.start()
test/*.test.ts     pkg.run(resource, action, input, context)
Dockerfile         worker image, non-root; entrypoint /app/packages/{{ .Slug }}/entrypoint
mise.toml          describe · test · build · dev · build:image · run · publish:image
```

## Rules

- **Declarations use the service API's own fields, in camelCase.** `scope()`
  takes what `POST /service_specification` takes (`assignableTo`,
  `selectors.subCategory`, …) plus `actions` (the well-known slugs from
  `Actions`) and `telemetry`. The manifest converts field names to snake_case.
  The JSON schema travels verbatim: property names and keywords (`visibleOn`,
  `editableOn`, `order`, `readOnly`) are never converted.
- **`handle()` is exhaustive.** Every action in `actions` (and every telemetry
  source) has exactly one handler and every handler answers a declared action;
  a mismatch throws at definition time, before anything is published. Add an
  action to `actions` and its handler in the same change.
- **A scope provisions nothing on create.** `create-scope` builds the target's
  footprint; the workload lands on `start-initial` and the other deployment
  actions. Lifecycle handlers return nothing.
- **Traffic is reported, not returned.** `switch-traffic` calls
  `ctx.deployment.reportTraffic(ctx.weight)`; the platform does not read it off
  the results.
- **Data actions return exactly their shape.** `log:read` returns
  `{ results: [{ message, datetime }] }` and nothing else; the platform shows
  what comes back and tracks no lifecycle for it.
- **`ctx.params` is the input**: the scope's attributes merged with the
  action's parameters. `ctx.scopeId`, `ctx.deploymentId`, `ctx.assetUrl` and
  `ctx.weight` are the platform-owned values, already mapped.
- **Fail with a name.** `throw new ActionError("CODE", message)`;
  `ActionError.retry(...)` when the platform may try again. Any other throw is
  reported as `EXECUTION_ERROR`.
- **`ctx.step(name, fn)` is the unit of work**, `ctx.log.*` the action's live
  log. Never `console.log` inside a handler — a data action's stdout is its
  answer.
- **Tests are `pkg.run`.** `await pkg.run(target, Actions.START_INITIAL, input, { scope, service })`
  returns `{ status, results, data, error, logs, steps }`: assert on those.
  The only platform call a handler makes itself (`reportTraffic`) is stubbed
  at the HTTP boundary in `test/scope.test.ts`.
- **Handlers are idempotent.** The platform retries; a second `create-scope`
  or `delete-scope` must find the work done and succeed.
- Never set `NP_MODE=dev` in the image: it switches the SDK to the in-memory
  platform client and the worker never reports lifecycle.

## Verify

```bash
mise run test
mise run describe
```
