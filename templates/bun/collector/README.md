# {{ .Name }}

A nullplatform **collector**: it reads a system of record and keeps the catalog
in sync with it through catalog-ingest-api. Built with `defineCollector` from
`@nullplatform/plugin/collector`, on `@nullplatform/ingest`, and shipped as a
**package**: one `np package publish` creates in your organization everything
its records need, and the image it pins runs wherever you deploy it.

You write:

- **`snapshot`** — everything the system of record holds right now, as raw
  records. Each snapshot becomes a *run*: when it finishes, entities this
  collector wrote earlier and no longer reports are soft-deleted (behind
  guards: an empty snapshot, or one that would delete too much, deletes
  nothing). A snapshot that throws is aborted and deletes nothing.
- **the definitions** — what the records become: a catalog **specification**
  per entity (its JSON Schema), the collector's **source type**, and per
  record type a **mapping** (JSONata) that turns a raw record into an entity
  `{ id, data }`, written to its specification. catalog-ingest-api evaluates
  the mapping, validates `data` against the specification and writes only
  what changed.
- **`watch`** (optional) — the changes as they happen; snapshots still run on
  the schedule and reconcile anything it missed.

The example reads an inventory export (`INVENTORY_URL`) and its change feed
(`INVENTORY_CHANGES_URL`, one JSON line per change): services and the teams
that own them. Without them it serves its own two-service inventory and
watches nothing.

## What to edit

| File | What it is |
|---|---|
| `src/collector.ts` | `inventoryCollector(config)`: the package (from `package.json`), the source, the schedule, `snapshot` and `watch` |
| `src/definitions.ts` | the specifications, the source type and its mappings, each bound to its specification by `endpoint`; every slug named after the package's |
| `src/mappings/*.jsonata` | one mapping per record type: a raw record in, `{ id, data }` out |
| `src/index.ts` | what the image runs: reads the deployment's configuration, `await main(collector)` |
| `src/local.ts` | the same, with an in-memory ingest: nothing reaches catalog-ingest-api or the platform |
| `test/` | snapshots, the watch, and every mapping's output validated against its specification, against `test/fixtures/` |
| `deploy/` | the Kubernetes manifests: `collector.yaml` (served), `cronjob.yaml` (one snapshot per run) |

### Names

Every definition is named after the package's slug, `{{ .Slug }}`
(package.json's `name`), so two collectors in one organization never write
each other's:

| Definition | Slug |
|---|---|
| source type (the source's `type`) | `{{ .Slug }}` |
| specification of a record type | `{{ .Slug }}-<record type>`: `{{ .Slug }}-team`, `{{ .Slug }}-service` |
| mapping | its record type: `team`, `service` |
| source (one per deployment) | `{{ .Slug }}`, unless `src/index.ts` passes another |

Renaming the package defines new ones; the old ones stay in the organization.

## 1. Prerequisites

- The nullplatform CLI, `np`, newer than 2.13.0: its `np package publish`
  creates a collector's definitions (`np upgrade`).
- [mise](https://mise.jdx.dev) (`brew install mise`); it installs bun.
- Docker with buildx, logged in to a registry the cluster can pull from.
- `kubectl` and a cluster to run the collector in (or any container runtime).
- Two API keys of the organization:
  - **to publish**: an organization admin's key. It creates the
    specifications, the source type, the mappings and the destinations
    (catalog-ingest-api's `organization:ingest_admin`, which an
    organization's `admin` and `ops` roles hold) and registers the package.
  - **to run**: the collector's own key, granted `organization:machine:ingest`
    at the NRN its source lives at (the organization's root):

    ```bash
    np api-key create --body '{"name":"{{ .Slug }}","grants":[{"nrn":"organization=<id>","role_slug":"organization:machine:ingest"}]}'
    ```

## 2. Develop and test

```bash
mise trust && mise install
mise run test       # snapshots, the watch, and each mapping against its specification, no network
mise run typecheck
mise run describe   # the manifest np package publish reads: the package, its definitions, its source and schedule
mise run local      # one snapshot against an in-memory ingest: prints its result, sends nothing
mise run dev        # served against the in-memory ingest, with hot reload, until Ctrl-C
```

## 3. Publish

```bash
export NP_API_KEY=<an organization admin's API key>
np package publish --nrn organization=<id> --dry-run   # every component as it would be sent; asks the API nothing

export NP_PUSH_REGISTRY=<registry>/<repository>         # e.g. ghcr.io/<owner>/{{ .Slug }}
IMAGE=$(mise run publish:image)                         # builds + pushes the image, prints <registry>/<repository>@sha256:<digest>
np package publish --nrn organization=<id> --image "$IMAGE"
```

Publish runs the package's `describe` and, in the organization:

| Component | What it is | First publish | Next ones |
|---|---|---|---|
| `entity_specification` `{{ .Slug }}-team`, `{{ .Slug }}-service` | the catalog specifications | created | updated |
| `source_type` `{{ .Slug }}` | the kind of system the source is | created | updated |
| `mapping` `{{ .Slug }}/team`, `{{ .Slug }}/service` | each record type's mapping, under the type | created | updated |
| `destination` `{{ .Slug }}/<mapping>/<specification>` | each mapping bound to its specification, for every source of the type | created | kept as found |
| package `{{ .Slug }}` | a revision pinning the image | created | a new revision (`--bump`, `--version`) |

Without `--image`, publish runs `publish:image` itself. Publishing again
changes only what changed.

## 4. Deploy

```bash
kubectl create namespace {{ .Slug }}
kubectl -n {{ .Slug }} create secret generic {{ .Slug }} \
  --from-literal=NP_API_KEY=<the collector's API key> \
  --from-literal=INVENTORY_URL=<where the inventory export lives>
sed "s|COLLECTOR_IMAGE|$IMAGE|" deploy/collector.yaml | kubectl apply -f -
```

`deploy/collector.yaml` serves it: a non-root, read-only Deployment of one
replica that snapshots on start and every six hours and watches in between.
Every key of the secret is a variable of the container:

| Variable | Meaning |
| --- | --- |
| `NP_API_KEY` | the collector's API key: exchanged for the token catalog-ingest-api takes |
| `NP_API_URL` | the platform API (default `https://api.nullplatform.com`); catalog-ingest-api is under it |
| `INVENTORY_URL` | the example's own: where the inventory export lives |
| `INVENTORY_CHANGES_URL` | the example's own: where the inventory streams its changes |

To take one snapshot per run instead (no watch), apply `deploy/cronjob.yaml`
the same way: a CronJob every six hours whose container sets
`NP_ACTION_CONTEXT='{}'`. Any other runtime works too: the image serves by
default, and takes one snapshot and exits with `NP_ACTION_CONTEXT='{}'`
(`mise run run` runs it with Docker).

## 5. Verify

```bash
kubectl -n {{ .Slug }} logs deploy/{{ .Slug }}   # "snapshot run-… completed: N seen, 0 stale, 0 deleted"

TOKEN=$(curl -s https://api.nullplatform.com/token -H 'content-type: application/json' \
  -d "{\"api_key\":\"$NP_API_KEY\"}" | jq -r .access_token)
api() { curl -s -H "Authorization: Bearer $TOKEN" "https://api.nullplatform.com/catalog/ingest$1"; }
SOURCE=$(api "/sources?slug={{ .Slug }}" | jq -r '.results[0].id')
api "/sources/$SOURCE/runs" | jq '.results[] | {id, status, counters}'                  # its runs
api "/sources/$SOURCE/entities" | jq '.results[] | {endpoint, external_id, deleted_at}'  # what it wrote, by specification
```

The entities show in the console's catalog, under the specifications'
names.

## 6. Change it and publish again

- **A field**: add it to the specification's `properties` (in
  `src/definitions.ts`) and to its mapping's `data`. An optional field is
  nullable (`"type": ["string", "null"]`), and the mapping writes `null`
  when the record lacks it: the catalog merges writes, so a field left out
  keeps its last value.
- **A record type**: a specification, a mapping (`src/mappings/<type>.jsonata`)
  in `SOURCE_TYPE.mappings` with its `endpoint`, and `snapshot` / `watch`
  yielding it. The record types the collector sends are its mappings'.
- **A relation**: `relations: { <name>: { type: "belongs_to", target: <its specification's slug>, alias: "<name>_id" } }`
  on the specification that points, the target's `external_id` under the
  alias in its mapping's `data`, the target described first.

```bash
mise run test                                                      # the mapping and the specification still agree
np package publish --nrn organization=<id> --dry-run               # what will change
IMAGE=$(mise run publish:image) && np package publish --nrn organization=<id> --image "$IMAGE"
sed "s|COLLECTOR_IMAGE|$IMAGE|" deploy/collector.yaml | kubectl apply -f -
```

A changed mapping or specification applies from the next run: the deployment
needs the new image only when the code changed.

Cutting a GitHub Release runs `.github/workflows/release.yml`: tests, then
`np package publish` from CI (secret `NULLPLATFORM_API_KEY`, variable
`NP_NRN=organization=<id>`).

## Troubleshooting

| What you see | Why | Fix |
| --- | --- | --- |
| the collector fails: `source type '{{ .Slug }}' does not exist (GET /source_types lists the ones there are)` | the package is not published in this organization (or under another slug) | publish it (3) with the key of the organization the collector's key belongs to |
| `no mapping is bound to a destination on source '…' for record type(s): …`, or `no record type of this collector is bound for source …` | a record type the collector sends has no destination: a mapping added without publishing, or one without `endpoint` | give the mapping its `endpoint`, publish again |
| the log says `not bound for this source, not sent: …` | the same, for some of its record types: the others are sent | the same |
| `403` `insufficient permissions to access the requested resource` | the key lacks its role: publishing needs an organization admin's key; the collector's needs `organization:machine:ingest` at the source's NRN | grant it (1), or use the right key |
| publish fails: `source type '{{ .Slug }}' is a global type: choose another slug` | nullplatform publishes a type of that slug | rename the package (`name` in `package.json`) |
| the collector crashes at start asking for credentials | no `NP_API_KEY` in its environment | add it to the secret (4) |
| a run is refused, nothing deleted (`guardTripped`) | the snapshot was empty (`rejectEmpty`) or would delete half the entities or more (`maxDeleteRatio`) | fix the source; the guards are `source.runs` in `src/collector.ts` |

New to the code? Read `AGENTS.md`.
