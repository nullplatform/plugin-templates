# AGENTS.md — {{ .Name }}

Guidance for AI agents / new contributors working in this **scope** package.

## What this is

A nullplatform scope plugin: a deployment target defined with
`defineScope({...})` from `@nullplatform/plugin/scope`. It's compiled to a
standalone binary and run as a **gRPC worker** — the controlplane agent spawns
it (a pod in Kubernetes, a container in Docker) and streams actions to it. You
write action handlers; the SDK owns the gRPC server, action routing, lifecycle
(in_progress → success/failed), and `--describe`.

## File map

```
src/
  index.ts          defineScope: schema, uiSchema, action → handler wiring
  actions/*.ts      one file per action (create-scope, start-initial, log:read, …)
Dockerfile          lean worker image (the agent spawns this)
mise.toml           tasks: dev, test, build:image, run, publish:image
config/             node-config env mapping
```

## How to add / change an action

1. Add a handler in `src/actions/<name>.ts`: `async (notification, emit) => result`.
2. Wire it in `src/index.ts` under `actions` with its `input`/`output` schema.
3. `mise run describe` to confirm it's in the manifest; `mise run test`.

## Rules that matter (don't break these)

- **`emit({ stdout })` is the action logger** — lines post to the service action
  and show live in the UI. Use it for progress. It is NOT the return value.
- **Data-fetch actions** (`log:read`, `instance:data`, anything under
  `log:`/`metric:`/`instance:`) must **return exactly the result shape** the
  platform validates (e.g. `{ results: [{ message, datetime }] }`) and must NOT
  write anything else to stdout — the platform reads stdout as that JSON. Don't
  `console.log` in a data-fetch handler; the SDK routes `emit` to the log API
  only for these, never the stdout stream.
- **A scope provisions nothing on create.** The workload is created by the
  deployment actions (`start-initial` / `start-blue-green`). Keep `create-scope`
  side-effect free.
- **Never set `NP_MODE=dev` in the image** — it switches the SDK to the in-memory
  client and the worker never reports lifecycle (scopes hang).
- The worker reaches the cluster (if it needs to) with its in-cluster
  ServiceAccount; the agent injects TLS, the API key, and the cluster CA trust.
  Don't hand-roll credentials.

## Run / test

- `mise run test` — unit tests.
- `mise run dev` — dev UI against fixtures (no platform calls).
- `np package run` — real local run: dockerized agent spawns this worker. Needs `NP_API_KEY`.
