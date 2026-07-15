# {{ .Name }}

A nullplatform **custom command** plugin — the low-level path: raw
`createPlugin` from `@nullplatform/plugin`, no scope/service scaffolding. The
platform dispatches a command and your `execute(req)` runs it. Compiled to a
standalone binary and run as a gRPC worker the controlplane agent spawns.

Use this for health checks, migrations, notifications, data sync — anything the
agent should run on your behalf that isn't a scope or a service.

## Prerequisites

- [mise](https://mise.jdx.dev) (`brew install mise`)
- Docker (for `run` / building the worker image)
- The `np` CLI — `curl https://cli.nullplatform.com/install.sh | sh`
- `NP_API_KEY` in your environment

## Develop

```bash
mise run test       # run the test suite
mise run describe   # print the plugin manifest (name/version/command_types)
```

## Run it locally

`np package run` (or `mise run run`) runs it like production: a controlplane
agent in Docker spawns this package's worker container and streams commands to
it over gRPC/mTLS.

```bash
export NP_API_KEY=...
mise run run
```

## What's here

`src/index.ts` registers the manifest (`registerManifest`) and starts the plugin
(`createPlugin({ execute }).start()`). `execute(req)` receives the command
payload and returns `{ success, data }`. It also handles `--describe` (prints the
manifest) so `np package publish` can read it.

## Publish

Cut a GitHub Release (or run the release workflow). CI builds the worker image,
pushes it, and runs `np package publish`. Configure the `NULLPLATFORM_API_KEY`
secret and `NP_NRN` variable. See `.github/workflows/release.yml`.

New to the code? Read `AGENTS.md`.
