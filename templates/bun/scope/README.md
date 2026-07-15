# {{ .Name }}

A nullplatform **scope** plugin (deployment target) built with the
`@nullplatform/plugin` SDK and run as a lean gRPC worker the controlplane agent
spawns on demand.

A *scope* is a place the platform can deploy to. Creating a scope provisions
nothing on its own — the workload lands when a **deployment** action runs.

## Prerequisites

- [mise](https://mise.jdx.dev) (`brew install mise`) — runs every task here
- Docker (for `run` / building the worker image)
- The `np` CLI — `curl https://cli.nullplatform.com/install.sh | sh`
- `NP_API_KEY` in your environment

## Develop

```bash
mise run dev        # form-based dev UI: trigger actions against fixtures, hot reload
mise run test       # run the test suite
mise run describe   # print the plugin manifest (what publish registers)
```

## Run it locally

`np package run` (or `mise run run`) runs the package **exactly like production**:
it starts a controlplane agent in Docker with the worker orchestrator, which
builds + spawns this package's lean worker container and streams actions to it
over gRPC/mTLS.

```bash
export NP_API_KEY=...        # your nullplatform API key
mise run run                 # builds the worker image, runs the agent (docker backend)
```

Under the hood it pulls the controlplane agent image, sets `NP_WORKER_BACKEND=docker`
+ `NP_WORKER_IMAGE={{ .Slug }}-worker:dev`, and advertises `-tags package:{{ .Slug }}`
so the platform routes this package's actions to your local agent. Then create a
scope of this type in the UI/CLI and watch it run against your machine.

Override the agent image with `NP_AGENT_IMAGE` if you need a specific build.

## Actions

| Action | What it does |
|---|---|
| `create-scope` / `delete-scope` | register / tear down the target (no workload) |
| `start-initial` / `start-blue-green` | deploy the workload |
| `switch-traffic` / `finalize-blue-green` / `rollback-deployment` | traffic lifecycle |
| `delete-deployment` | remove one deployment |
| `diagnose-scope` / `diagnose-deployment` | health checks |
| `log:read` / `instance:data` | telemetry (logs + instances) |

Handlers live in `src/actions/`; they're wired in `src/index.ts` via `defineScope`.

## Publish

Cut a GitHub Release (or run the release workflow). CI builds the multi-arch
worker image, pushes it to your registry, and runs `np package publish`, which
registers the scope type, actions, channel, and a package revision pinned to the
image. Configure the `NULLPLATFORM_API_KEY` secret and `NP_NRN` variable in the
repo. See `.github/workflows/release.yml`.

New to the code? Read `AGENTS.md`.
