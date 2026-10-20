# {{ .Name }}

A nullplatform scope package written with `@nullplatform/plugin`.

```
src/schema.ts      inputs, outputs, form, Context type
src/resources.ts   scope({ ..., plans, actions })
src/scope.ts       create-scope, delete-scope
src/deployment.ts  deployment actions
src/logs.ts        log:read
test/              pkg.run(target, action, input, context)
```

- Every input is listed in `schema.required` and has a default.
- A deployment returns only the schema's read-only outputs.
- Step names in `plans` match the `ctx.step` names.
- `switch-traffic` reports the weight with `ctx.deployment.reportTraffic`.
- Fail with `new ActionError("CODE", message)`; use `ActionError.retry(...)` when trying again can succeed.
- Log with `ctx.log`, never `console.log`.
- Handlers must be safe to run twice.
- Test every action with `pkg.run`.

```bash
mise run test && mise run typecheck
```
