# {{ .Name }}

A nullplatform service package written with `@nullplatform/plugin`.

```
src/schema.ts      service and link schemas, form, Context types
src/resources.ts   service({ ... }) and link(svc, { ... })
src/service.ts     create, update, delete
src/connect.ts     the link's create, update, delete
test/              pkg.run(resource, action, input, context)
```

- Every input is listed in `serviceSchema.required` and has a default.
- `create` and `update` return only the schema's read-only outputs.
- Step names in `plans` match the `ctx.step` names.
- Fail with `new ActionError("CODE", message)`; use `ActionError.retry(...)` when trying again can succeed.
- Log with `ctx.log`, never `console.log`.
- Handlers must be safe to run twice.
- Test every action with `pkg.run`.

```bash
mise run test && mise run typecheck
```
