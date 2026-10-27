# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **package** with one `execute()` route, defined with
`definePlugin` from `@nullplatform/plugin`: the agent hands the worker a
document (`NP_ACTION_CONTEXT` of a `package-exec` agent command) and
`handle(payload, context)` answers it. No specification, no lifecycle: the
answer goes back to the caller in the same response. Nothing runs on import:
`src/index.ts` is `await main(plugin)` — `--describe` prints the manifest, a
document in `NP_ACTION_CONTEXT` is answered once, otherwise it serves the
agent's gRPC protocol until SIGTERM. `src/local.ts` is the same with in-memory
ports.

## File map

```
src/handler.ts      commandOf(payload) + handle(payload, context): one case per action
src/plugin.ts       definePlugin({ package, routes: [execute(handle)] })
src/index.ts        await main(plugin): the real ports
src/local.ts        await main(plugin, { fetch: recordingPlatform().fetch, tracing: noopTracing })
test/fixtures/      documents as a caller sends them
test/*.test.ts      run(plugin, document) from @nullplatform/plugin/testing
Dockerfile          worker image, non-root; entrypoint /app/packages/{{ .Slug }}/entrypoint
mise.toml           describe · test · typecheck · build · build:all · local · dev · build:image · run · publish:image
```

## Rules

- **The document is yours.** `payload` is the parsed document, as delivered
  (a document `{ notification: … }` hands over what it wraps). Validate it:
  `commandOf` refuses a document without `action`.
- **Return the answer.** What `handle` returns is the response's data. Throw
  `new ActionError("CODE", message)` from `@nullplatform/plugin` to refuse;
  any other throw is reported as `EXECUTION_ERROR`.
- **`--describe` is the SDK's.** `main` prints `plugin.manifest()`: the package
  and the runs tooling offers. An `execute()` route publishes no component.
- **Routes are tried in order.** `execute()` matches anything, so a route you
  add (an `event(name, handler)`, say) goes before it.
- **Steps tell what happened.** `context.trace.step(key, (step) => …)` with
  `step.explain({ what })` shows on the command's trace; silent without
  tracing, and the step still runs. Step keys are letters, digits, `-`, `_`,
  `.`.
- **Logs are `context.log`**, on stderr. No `console.log` in a handler: stdout
  is the answer.
- **Never trust names from the caller for access.** Resolve what to touch from
  platform data (`context.api`: a service id → its attributes), not from a
  bucket or host the document names.
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
