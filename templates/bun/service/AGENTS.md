# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **package**: the dependency service `{{ .Slug }}` and its
`connect` link, declared as values with `@nullplatform/plugin/package`, with
one handler function per action. `src/main.ts` is `pkg.start()`: `--describe`
prints the manifest, an action in `NP_ACTION_CONTEXT` runs once, otherwise
the gRPC server serves the agent. `Dockerfile` compiles it to one binary.

## File map

```
src/schema.ts      the attribute schemas, the console form (uiSchema), the Context types
src/resources.ts   service({ …, plans, actions }) + link(svc, { … }): everything published
src/service.ts     create / update / delete of the service
src/connect.ts     create / update / delete of the link
src/package.ts     definePackage({ name, version, description, components, tracing })
src/main.ts        pkg.start()
test/*.test.ts     pkg.run(resource, action, input, context)
Dockerfile         worker image, non-root; entrypoint /app/packages/{{ .Slug }}/entrypoint
mise.toml          describe · test · build · dev · build:image · run · publish:image
```

## Rules

- **Declarations use the service API's own fields, in camelCase.** `service()`
  and `link()` take exactly what `POST /service_specification` and
  `POST /link_specification` take: `useDefaultActions`, `assignableTo`,
  `selectors.subCategory`, `actionSpecifications`, … The manifest converts them
  to snake_case. JSON schemas travel verbatim: property names and keywords
  (`visibleOn`, `editableOn`, `export`, `order`, `secret`) are never converted.
- **Actions live in the declaration.** `service({ actions: { create, update, delete } })`
  binds the default actions as functions; a custom action is an entry with its
  specification (`{ name, parameters, results, handler }`). With
  `useDefaultActions` (the default) all three default actions need a handler,
  and the definition throws before anything is published if one is missing.
- **Every action has a plan, in stages.** `plans` names the steps each action
  runs, grouped into stages with titles; step keys are the exact `ctx.step`
  names. That is what the console's timeline shows for the run.
- **Results must fit the schema.** What `create` / `update` return becomes the
  entity's attributes: every key a declared property, of the declared type, or
  the action fails with `INVALID_RESULTS` before it leaves the worker. `delete`
  returns nothing. A custom action returns what its `results.schema` declares.
- **`ctx.params` is the input**: the entity's attributes merged with the
  action's parameters, typed from the schema. A link handler reads its service
  through `ctx.service.attributes`; `ctx.link` is the link entity.
- **Fail with a name.** `throw new ActionError("CODE", message)`;
  `ActionError.retry(...)` when the platform may try again. Any other throw is
  reported as `EXECUTION_ERROR`.
- **Steps tell what happened.** `ctx.step(name, (step) => …)`: call
  `step.explain({ what, why })` with the facts, `step.link(...)` and
  `step.output(...)` when there is somewhere to go or data worth keeping;
  `ctx.trace.explain(...)` is the run's own story. `ctx.log.*` is the live log.
  Never `console.log` inside a handler.
- **The tracer is built in `package.ts`.** A compiled worker cannot resolve the
  SDK's lazy import of `@nullplatform/tracing`; keep the static import.
- **Tests are `pkg.run`.** `await pkg.run(svc, "create", input, { service, link, providers })`
  returns `{ status, results, error, logs, steps }`: assert on those. No
  fixtures, no recorder, nothing about the platform.
- **Handlers are idempotent.** The platform retries; a second `create` or
  `delete` must find the work done and succeed.
- Never set `NP_MODE=dev` in the image: it switches the SDK to the in-memory
  platform client and the worker never reports lifecycle.

## Verify

```bash
mise run test
mise run typecheck
mise run describe
```
