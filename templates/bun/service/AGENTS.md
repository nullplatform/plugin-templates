# AGENTS.md — {{ .Name }}

Guidance for AI agents / new contributors working in this **service** package.

## What this is

A nullplatform service plugin (an application dependency) defined with
`defineService({...})` from `@nullplatform/plugin/service`. Compiled to a
standalone binary and run as a **gRPC worker** the controlplane agent spawns.
The SDK owns the gRPC server, action routing, lifecycle, and `--describe`; you
write handlers.

With `useDefaultActions: true` the platform derives the `create`/`update`/`delete`
action specs from `schema` — you don't declare action specs, only handlers.

## File map

```
src/index.ts    defineService: schema + create/update/delete handlers
Dockerfile      lean worker image (the agent spawns this)
mise.toml       tasks: dev, test, build:image, run, publish:image
```

## How to change it

1. Edit `schema` for the attributes users configure (visible on create/update).
2. Edit the `create` / `update` / `delete` handlers in `src/index.ts`.
3. `mise run describe` + `mise run test`.

## Rules that matter

- **`emit({ stdout })` is the action logger** — lines post to the service action
  (live in the UI). Use it for progress; it is NOT the return value.
- **Never set `NP_MODE=dev` in the image** — it switches the SDK to the in-memory
  client and lifecycle is never reported (actions hang).
- The worker gets its API key + TLS from the agent at spawn; don't hand-roll them.
- Keep handlers idempotent — the platform may retry.

## Run / test

- `mise run test` — unit tests.
- `mise run dev` — dev UI against fixtures (no platform calls).
- `np package run` — real local run: dockerized agent spawns this worker. Needs `NP_API_KEY`.
