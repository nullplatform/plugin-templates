# {{ .Name }}

A nullplatform command handler written with `@nullplatform/plugin`.

```
src/handler.ts   handle({ payload }): one case per action
test/            pkg.execute(document)
```

- What `handle` returns is the response.
- Fail with `new ActionError("CODE", message)`; use `ActionError.retry(...)` when trying again can succeed.
- Log with `ctx.log`, never `console.log`.
- Handlers must be safe to run twice.
- Test every action with `pkg.run`.

```bash
mise run test && mise run typecheck
```
