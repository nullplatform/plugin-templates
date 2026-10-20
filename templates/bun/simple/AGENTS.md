# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **package** with one `execute()` component: the agent hands the
worker a document (`NP_ACTION_CONTEXT` of a `package-exec` agent command) and
`handle(ctx)` answers it. No specification, no lifecycle: the answer goes back
to the caller in the same response.

## File map

```
src/handler.ts   commandOf(payload) + handle(ctx): one case per action
src/package.ts   definePackage({ name, version, description, components: [execute(handle)], tracing })
src/main.ts      --describe (own manifest), else pkg.start()
test/*.test.ts   pkg.execute(document)
Dockerfile       worker image, non-root; entrypoint /app/packages/{{ .Slug }}/entrypoint
mise.toml        describe · test · typecheck · build · build:all · dev · build:image · run · publish:image
```

## Rules

- **The document is yours.** `ctx.payload` is the parsed document (`ctx.raw`
  the string). Validate it: `commandOf` refuses a document without `action`.
  The platform may nest the command under `command`, next to `notification`.
- **Return the answer.** What `handle` returns is the response's data. Throw
  `new ActionError("CODE", message)` to refuse; any other throw is reported as
  `EXECUTION_ERROR`.
- **Keep `--describe` in `main.ts`.** `np package publish` runs the binary with
  `--describe`; the SDK's own manifest has no place for `execute()` yet.
- **Steps tell what happened.** `ctx.step(name, (step) => …)` with
  `step.explain({ what })` shows on the command's trace; silent without tracing.
- **No `console.log` in a handler** — stdout is the answer.
- **Never trust names from the caller for access.** Resolve what to touch from
  platform data (a service id → its attributes), not from a bucket or host the
  document names.
- **The tracer is built in `package.ts`.** A compiled worker cannot resolve the
  SDK's lazy import of `@nullplatform/tracing`; keep the static import.
- Never set `NP_MODE=dev` in the image.

## Verify

```bash
mise run test
mise run typecheck
mise run describe
```
