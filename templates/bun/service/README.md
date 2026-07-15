# {{ .Name }}

A nullplatform **service** plugin (application dependency — a database, cache,
queue, …) built with the `@nullplatform/plugin` SDK and run as a lean gRPC
worker the controlplane agent spawns on demand.

A *service* is something an application needs to run. With `useDefaultActions`
the platform generates the create/update/delete action specs from your `schema`
— you just write the handlers.

## Prerequisites

- [mise](https://mise.jdx.dev) (`brew install mise`)
- Docker (for `run` / building the worker image)
- The `np` CLI — `curl https://cli.nullplatform.com/install.sh | sh`
- `NP_API_KEY` in your environment

## Develop

```bash
mise run dev        # form-based dev UI: trigger actions against fixtures, hot reload
mise run test       # run the test suite
mise run describe   # print the plugin manifest
```

## Run it locally

`np package run` (or `mise run run`) runs the package like production: it starts
a controlplane agent in Docker with the worker orchestrator, which builds +
spawns this package's lean worker container and streams actions to it over
gRPC/mTLS.

```bash
export NP_API_KEY=...
mise run run                 # builds the worker image, runs the agent (docker backend)
```

It pulls the controlplane agent image, sets `NP_WORKER_BACKEND=docker` +
`NP_WORKER_IMAGE={{ .Slug }}-worker:dev`, and advertises `-tags package:{{ .Slug }}`
so the platform routes this service's actions to your local agent. Override the
agent image with `NP_AGENT_IMAGE`.

## Actions

`create` / `update` / `delete` — provision, reconfigure, and tear down the
dependency. They're declared in `src/index.ts` via `defineService` with
`useDefaultActions: true` (the platform generates the action specs from
`schema`); you own the handler bodies.

## Publish

Cut a GitHub Release (or run the release workflow). CI builds the multi-arch
worker image, pushes it to your registry, and runs `np package publish`.
Configure the `NULLPLATFORM_API_KEY` secret and `NP_NRN` variable. See
`.github/workflows/release.yml`.

New to the code? Read `AGENTS.md`.
