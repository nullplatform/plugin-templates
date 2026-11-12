# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this package.

## What this is

A nullplatform **UI plugin**: React widgets the dashboard's host mounts in the
slots `manifest.json` contributes to. The bundle runs in a sandboxed worker in the
browser and renders through the host's components; it reaches the platform only
through `useNullplatform()`, and only the calls `permissions` declares. There is
no worker process and no agent. `describe.ts` is what `np package publish` reads:
`defineUIBundle` from `@nullplatform/plugin/ui` prints the package and one
`ui_bundle` component, both from `manifest.json`. The bundle never imports it.

## File map

```
manifest.json         the plugin: id (= the package slug), contributes, permissions
src/index.tsx         defineUI({ widgets }): the bundle's entry
describe.ts           defineUIBundle({ package, manifest }): what publish reads
src/widgets/          one component per widget; index.ts exports them by name
fixtures.json         dev answers for API calls, keyed "METHOD /path/{param}"
test/*.test.ts        the manifest as the API checks it; the describe
vite.config.ts        builds ONE classic script: dist/plugin.js
mise.toml             describe · test · typecheck · build · dev · certs
```

## Rules

- **`manifest.json` is the source of truth.** The package's slug is its `id`; a
  contribution's `widget` must be a key of `src/widgets/index.ts` (a test holds
  it); every contribution gets an `id`, unique in the manifest, since layouts and
  flags point at it. Renaming an `id` renames the block for every user's layout.
- **Declare every call.** `permissions.api` lists the public API paths the widgets
  call (`{param}` placeholders allowed); `permissions.http` the external hosts. Any
  other call is refused by the host. Keep the list exact: it is shown at install.
- **Only the host's components.** Render with what `@nullplatform/ui-plugin-sdk`
  exports (`Card`, `Text`, `Stack`, `DataTable`…); there is no DOM to reach.
- **One script.** `dist/plugin.js` must import nothing at runtime: keep
  `vite.config.ts`'s `iife` build and `inlineDynamicImports`.
- **The version is the revision's.** `np package publish --bump|--version` sets it,
  and publish writes it into the bundle's manifest; `manifest.json`'s `version` is
  the first publish's and is never raised by hand.
- **The package is the manifest's.** `describe.ts` names the package by
  `manifest.json`'s `name`, `id` (the slug) and `description`: edit them there.
- **Publish never installs.** `np package install --nrn …` mounts a revision at an
  NRN with a plain installation. Conditions (`when`) and rollouts are set through
  the UI plugin API's installations endpoint (`/plugin_installations`); no
  dashboard screen edits them yet. The layout editor's catalog, in progress,
  installs a revision at the level being edited, also as a plain installation.
