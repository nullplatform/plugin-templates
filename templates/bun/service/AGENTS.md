# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **package**: the dependency service `{{ .Slug }}` and its
`connect` link, defined with `defineService` from
`@nullplatform/plugin/service`, with one handler function per action. Nothing
runs on import: `src/index.ts` is `await main(service)` — `--describe` prints
the manifest, a document in `NP_ACTION_CONTEXT` is answered once, otherwise it
serves the agent's gRPC protocol until SIGTERM. `src/local.ts` is the same
with in-memory ports. `Dockerfile` compiles `src/index.ts` to one binary.

## File map

```
src/schema.ts       the service and link specifications (attributes, console form), handler input types
src/service.ts      defineService({ package, specification, actions, links: { connect } })
src/plans.ts        each action's title, description and plan
src/dependency.ts   create / update / delete of the service
src/connect.ts      create / update / delete of the link
src/index.ts        await main(service): the real ports
src/local.ts        await main(service, { fetch: recordingPlatform().fetch, tracing: noopTracing })
test/fixtures/      the documents the platform sends each action, as the agent delivers them
test/*.test.ts      run(service, fixture.notification, { with }) from @nullplatform/plugin/testing
Dockerfile          worker image, non-root; entrypoint /app/packages/{{ .Slug }}/entrypoint
mise.toml           describe · test · typecheck · build · local · dev · build:image · run · publish:image
```

## Rules

- **Specifications are the API's bodies, as written.** `specification` is what
  `POST /service_specification` takes and each link's `specification` what
  `POST /link_specification` takes (`selectors`, `attributes`,
  `use_default_actions`, `assignable_to`, …), in the API's own snake_case;
  nothing converts them. The package (name, version, description) comes from
  `package.json`, and names the service.
- **Schema keys are snake_case.** The platform snake-cases every key it sends a
  plugin, so `defineService` refuses a property it would rename
  (`connectionUrl` arrives as `connection_url`: name it so).
- **Actions live in the definition.** `actions: { create, update, delete }`
  binds the default actions; each entry is a handler, or
  `{ handler, title, description, plan }`. A custom action is an entry with its
  `specification` (its `action_specification` body: `parameters`, `results`).
  While the specification uses its default actions, all three need a handler,
  and the definition throws before anything is published if one is missing; a
  link's the same.
- **Every action has a plan.** `plans.ts` names the steps each action runs,
  under a titled stage; step keys (letters, digits, `-`, `_`, `.`) are the exact
  `context.trace.step` names. That is what the console's timeline shows.
- **A handler is `(input, context)`.** `input` is what the platform sent:
  `input.parameters` (a default action's: the attributes asked for, typed by
  the schema), `input.service` with its `attributes` as stored, `input.link`
  with its `attributes` on a link's action. `context` is the SDK's tools:
  `log`, `trace`, `api`, `signal`, `credentials`.
- **Results are attributes.** What `create` / `update` return is `Partial` of
  the attributes: the platform copies it into the entity's. `delete` returns
  `{}`. A custom action returns what its `results` schema declares.
- **Fail with a name.** `throw new ActionError("CODE", message, { retryable: true })`
  from `@nullplatform/plugin` when the platform may try again. Any other throw
  is reported as a failure too.
- **Steps tell what happened.** `context.trace.step(key, (step) => …)`: call
  `step.explain({ what, why })` with the facts, `step.link(...)` and
  `step.output(...)` when there is somewhere to go or data worth keeping;
  `context.trace.explain(...)` is the run's own story. `context.log` (`debug`,
  `info`, `warn`, `error`) is the live log; each line at info and above is
  posted to the action. Never `console.log` inside a handler.
- **Tests are `run()`.** `await run(service, create.notification, { with })`
  returns `{ success, data, failure, requests, logs, steps }`; `with` lays
  fields over the document's payload.
- **Handlers are idempotent.** The platform retries; a second `create` or
  `delete` must find the work done and succeed.
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
