# {{ .Name }}

A nullplatform **collector**: it reads a system of record and keeps the catalog
in sync with it through [catalog-ingest-api](https://github.com/nullplatform/catalog-ingest-api).
Built with `defineCollector` from `@nullplatform/plugin/collector`.

You write two things:

- **`snapshot`** — everything the system of record holds right now, as raw
  records. Each snapshot becomes a *run*: when it finishes, entities this
  collector wrote earlier and no longer reports are soft-deleted (behind
  guards: an empty snapshot, or one that would delete too much, deletes
  nothing). A snapshot that throws is aborted and deletes nothing.
- **`mappings`** — per record type, an expression (JSONata, jq or CEL) that
  turns a raw record into a catalog entity `{ id, data }`. catalog-ingest-api
  evaluates it, validates `data` against the target specification and writes
  only what changed.

Optionally, **`watch`** streams changes as they happen; snapshots still run on
schedule and reconcile anything it missed.

## Prerequisites

- [mise](https://mise.jdx.dev) (`brew install mise`)
- Docker (for the image)
- A catalog-ingest-api URL and a nullplatform API key for real runs
- The target specification in the catalog. The example writes to
  `inventory-service`:

  ```json
  {
    "slug": "inventory-service",
    "name": "Inventory service",
    "schema": {
      "type": "object",
      "properties": {
        "external_id": { "type": "string", "primaryKey": true, "autoGenerate": false },
        "name": { "type": "string" },
        "team": { "type": "string" },
        "tier": { "type": "string" },
        "repository": { "type": ["string", "null"] }
      },
      "required": ["external_id", "name"]
    }
  }
  ```

Optional properties are nullable (`repository` above): when an entry loses one,
the collector's write clears it. The catalog merges writes, so a non-nullable
property that disappears keeps its last value.

## Develop

```bash
mise run test       # snapshot + mapping tests, no network
mise run dev        # runs the schedule against an in-memory ingest: prints, sends nothing
mise run describe   # print the collector manifest
```

`mise run dev` feeds a real API when you set `NP_INGEST_API_URL` (with
`NP_INGEST_TOKEN` for a local API, or `NP_API_KEY`). Lower
`NP_COLLECTOR_INTERVAL_SECONDS` to iterate faster.

## Run

```bash
export NP_INGEST_API_URL=https://... NP_API_KEY=...
mise run once       # one snapshot, prints {"status":"completed","reconciliation":{...}}
mise run run        # the image, long-running: a snapshot every interval + the watch
```

Exit codes of `--once`: `0` completed, `2` a guard tripped (nothing deleted),
`1` the snapshot failed. Use it as a cron job.

| Variable | Meaning |
| --- | --- |
| `NP_INGEST_API_URL` | catalog-ingest-api base URL (required outside dev/test) |
| `NP_API_KEY` | nullplatform API key, exchanged for tokens |
| `NP_INGEST_TOKEN` | a ready bearer token instead (local API) |
| `NP_COLLECTOR_SOURCE_SLUG` | the slug of the ingest source this deployment feeds (default: `{{ .Slug }}`) |
| `NP_COLLECTOR_SOURCE_NAME` | its display name |
| `NP_COLLECTOR_INTERVAL_SECONDS` | seconds between snapshots (default: `collector.intervalSeconds`) |
| `INVENTORY_FILE` | the example's own setting (`collector.settings.inventoryFile`) |

Run one deployment per system you collect from (one per cluster, per org…),
each with its own `NP_COLLECTOR_SOURCE_SLUG`.

## Deploy

Cut a GitHub Release (or run the release workflow): CI tests, then builds and
pushes the multi-arch image. Run it as a long-lived container (default command
`--run`), or as a cron job with the command `--once`.

The SDK can also run a collector as a nullplatform agent worker (a `collect`
action on demand, plus the schedule). Registering a collector package with the
platform needs `np package publish` support for `kind: collector`; until then,
deploy the image as above.

New to the code? Read `AGENTS.md`.
