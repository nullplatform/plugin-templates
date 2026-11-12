# {{ .Name }}

A nullplatform **UI plugin** as a package: widgets and pages the dashboard mounts,
written in React with `@nullplatform/ui-plugin-sdk`. It runs in the browser,
inside the dashboard, in a sandbox: it has no worker, no agent and no image.

`manifest.json` is its definition: where it contributes (a slot of the dashboard
and the widget that fills it) and the API calls it may make. `np package publish`
uploads the built bundle and pins it in a package revision; `np package install`
puts that revision to work at an NRN, where the dashboard mounts it.

## What to edit

| File | What it is |
|---|---|
| `manifest.json` | the plugin: `id` (its slug), `contributes` (slot → widget), `permissions` (the API calls it may make) |
| `src/widgets/` | one React component per widget, exported by name from `src/widgets/index.ts` |
| `src/index.tsx` | `defineUI({ widgets })`: the bundle's entry |
| `describe.ts` | `defineUIBundle({ package, manifest })`: what `np package publish` reads; the bundle never imports it |
| `fixtures.json` | answers for the API calls while you develop, keyed like `permissions.api` |
| `test/` | the manifest as the API checks it, and the describe |

## Develop

```bash
mise run test        # the manifest and the describe, no platform
mise run typecheck
mise run build       # dist/plugin.js, the bundle publish uploads
mise run describe    # the manifest np package publish reads
mise run certs       # once: a locally trusted https://localhost certificate (mkcert)
np package dev       # rebuild on change, served to the dashboard's plugin dev mode
```

`np package dev` serves `manifest.json`, `dist/plugin.js` and `fixtures.json` on
`https://localhost:4300`; load it from the dashboard's plugin dev mode to see the
widget where it contributes, with the fixtures' answers.

## Publish and install

```bash
export NP_API_KEY=...
np package publish --nrn organization=…                       # build, upload the bundle, register the revision
np package install --nrn organization=…:account=…:namespace=…:application=…   # mount it there
```

The version is the revision's: `--bump` (patch by default) or `--version`, as for
any package. Publish writes it into the bundle's manifest, so `manifest.json`'s
`version` is never raised by hand. Cutting a GitHub Release runs `.github/workflows/release.yml`, which
publishes from CI (secret `NULLPLATFORM_API_KEY`, variable `NP_NRN`, and
`NP_INSTALL_NRN` to install).

New to the code? Read `AGENTS.md`.
