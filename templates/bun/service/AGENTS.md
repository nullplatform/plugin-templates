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
src/resources.ts   service() + link(): the specifications, as values
src/service.ts     create / update / delete of the service
src/connect.ts     create / update / delete of the link
src/package.ts     definePackage({ name, version, description, resources, handlers })
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
- **`handle()` is exhaustive.** Every declared action has exactly one handler
  and every handler answers a declared action; a mismatch throws at definition
  time, before anything is published. A custom action goes under
  `actionSpecifications` and gets its handler in the same change.
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
- **`ctx.step(name, fn)` is the unit of work**, `ctx.log.*` the action's live
  log. Never `console.log` inside a handler.
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
mise run describe
```
