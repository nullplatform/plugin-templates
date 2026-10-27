# {{ .Name }}

A nullplatform **collector**: it reads a system of record and keeps the catalog
in sync with it through catalog-ingest-api. Built with `defineCollector` from
`@nullplatform/plugin/collector`, on `@nullplatform/ingest`.

You write:

- **`snapshot`** — everything the system of record holds right now, as raw
  records. Each snapshot becomes a *run*: when it finishes, entities this
  collector wrote earlier and no longer reports are soft-deleted (behind
  guards: an empty snapshot, or one that would delete too much, deletes
  nothing). A snapshot that throws is aborted and deletes nothing.
- **`mappings`** — per record type, an expression (JSONata, jq or CEL) that
  turns a raw record into a catalog entity `{ id, data }`, and where it is
  written: a **target** (`catalog`) and an **endpoint** of it, by slug (for the
  catalog, a specification's slug). catalog-ingest-api evaluates it, validates
  `data` against the endpoint's schema and writes only what changed. A type in
  `recordTypes` is mapped by the source type's shared mappings instead, which
  the organization binds once.
- **`watch`** (optional) — the changes as they happen; snapshots still run on
  the schedule and reconcile anything it missed.

The example reads an inventory export (`INVENTORY_URL`) and its change feed
(`INVENTORY_CHANGES_URL`, one JSON line per change); without them it serves its
own two-service inventory and watches nothing.

## What to edit

| File | What it is |
|---|---|
| `src/collector.ts` | `inventoryCollector(config)`: the package (from `package.json`), the source, the mappings, the schedule, `snapshot` and `watch` |
| `src/index.ts` | what the image runs: reads the deployment's configuration, `await main(collector)` |
| `src/local.ts` | the same, with an in-memory ingest: nothing reaches catalog-ingest-api or the platform |
| `test/` | snapshots, the watch and the mapping, in-process, against the export and feed in `test/fixtures/` |

## Prerequisites

- [mise](https://mise.jdx.dev) (`brew install mise`)
- Docker (for the image)
- A nullplatform API key for real runs
- The catalog specification the mapping's `endpoint` names. The example
  writes to `inventory-service`:

  ```json
  {
    "slug": "inventory-service",
    "name": "Inventory service",
    "schema": {
      "type": "object",
      "properties": {
        "external_id": { "type": "string", "primaryKey": true, "autoGenerate": false },
        "name": { "type": "string" },
        "owner": { "type": "string" },
        "region": { "type": ["string", "null"] }
      },
      "required": ["external_id", "name"]
    }
  }
  ```

The mapping names the endpoint by slug, not id, so the same collector runs in
every organization. Optional properties are nullable (`region` above): when an
entity loses one, the collector's write clears it; the catalog merges writes,
so a non-nullable property that disappears keeps its last value.

## Develop

```bash
mise run test       # snapshots, the watch and the mapping, no network
mise run typecheck
mise run describe   # the manifest: the package, its source, mappings and schedule
mise run local      # one snapshot against an in-memory ingest: prints, sends nothing
mise run dev        # served against the in-memory ingest, with hot reload, until Ctrl-C
```

## Run

```bash
export NP_API_KEY=...
mise run once       # one real snapshot; prints {"success":true,"data":{"status":"completed",…}}
mise run run        # the image, long-running: a snapshot every interval + the watch
```

| Variable | Meaning |
| --- | --- |
| `NP_API_KEY` | the nullplatform API key: exchanged for the token catalog-ingest-api takes |
| `NP_API_URL` | the platform API (default `https://api.nullplatform.com`); catalog-ingest-api is under it |
| `NP_ACTION_CONTEXT` | `{}`: take one snapshot and exit (a cron job); unset: serve |
| `INVENTORY_URL` | the example's own: where the inventory export lives |
| `INVENTORY_CHANGES_URL` | the example's own: where the inventory streams its changes |

Everything else is code. The source the collector feeds is the package's slug
unless `src/index.ts` passes another (`main(collector, { source: { slug, nrn, name } })`):
run one deployment per system you collect from, each with its own source. The
interval is `schedule.intervalSeconds` unless the `intervalSeconds` port says
otherwise; a local catalog-ingest-api is the `ingestUrl` and `ingestToken`
ports.

## Deploy

Cut a GitHub Release (or run the release workflow): CI tests, then builds and
pushes the multi-arch image. Run it as a long-lived container, or as a cron
job with `NP_ACTION_CONTEXT='{}'`.

New to the code? Read `AGENTS.md`.
