# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this **collector**.

## What this is

A collector defined with `defineCollector` from
`@nullplatform/plugin/collector`, on `@nullplatform/ingest`. It reads a system
of record and feeds the catalog through catalog-ingest-api: full **snapshots**
(reconciled, so what disappeared is deleted) and a **watch** (the changes as
they happen). The SDK owns the run lifecycle, batching, retries and the
schedule; you write `snapshot`, `watch` and the **definitions** its records
need: the catalog specifications, the source type and the type's mappings.
`np package publish` creates them in the organization from what `--describe`
prints. Nothing runs on import: `src/index.ts` is `await main(collector)` —
`--describe` prints the manifest, `NP_ACTION_CONTEXT='{}'` takes one snapshot,
otherwise it serves (a snapshot every interval, plus the watch) until SIGTERM.
`src/local.ts` is the same with an in-memory ingest.

## File map

```
src/collector.ts         inventoryCollector(config): package, source, entities, sourceType, schedule, snapshot, watch
src/definitions.ts       PACKAGE_SLUG, specificationOf(type), ENTITIES (the specifications), SOURCE_TYPE (its mappings, each with its endpoint)
src/mappings/*.jsonata   one JSONata mapping per record type: record in, { id, data } out
src/index.ts             reads INVENTORY_URL / INVENTORY_CHANGES_URL, await main(collector): the real ports
src/local.ts             await main(inventoryCollector({}), { ingest: new InMemoryIngest(), fetch: recordingPlatform().fetch, tracing: noopTracing })
test/fixtures/           an inventory export and a change feed
test/collector.test.ts   the manifest's components, run(collector, {}, { ports: { ingest } }), serve() for the watch
test/definitions.test.ts each record a snapshot sends, through its mapping, validated against its specification
deploy/                  collector.yaml (a Deployment, served) · cronjob.yaml (one snapshot per run)
Dockerfile               the image: served by default, one snapshot with NP_ACTION_CONTEXT='{}'
mise.toml                describe · test · typecheck · build · local · dev · once · build:image · run · publish:image
```

## How to change it

1. Replace the inventory in `src/collector.ts` with your system of record:
   `snapshot` yields one `{ type, payload }` per object it holds. Keep payloads
   raw — shaping belongs in the mapping. Yield a relation's target before what
   points at it.
2. **Add a field**: add it to the specification's `properties` in
   `src/definitions.ts` (`index: ["filter", "sort", "fulltext", "facet"]` to
   query by it) and to the mapping's `data`. An optional field is nullable
   (`"type": ["string", "null"]`) and the mapping writes `null` when the
   record lacks it: the catalog merges writes, so a field left out keeps its
   last value. Schema keys are snake_case.
3. **Add a record type**: a specification in `ENTITIES` (slug
   `specificationOf("<type>")`, an `external_id` with `primaryKey: true,
   autoGenerate: false`), a mapping `src/mappings/<type>.jsonata` returning
   `{ id, data }` (`id` the entity's `external_id`; a list, or `null` to skip
   the record), its entry in `SOURCE_TYPE.mappings` keyed by the record type
   with `endpoint: specificationOf("<type>")`, and `snapshot` / `watch`
   yielding it. The record types the collector declares are its mappings':
   yield only those.
4. **Add an entity of another record type's data** (a team from a service's
   owner): a specification and a mapping keyed by its own slug with
   `recordType: "<the type it reads>"` and its `endpoint`. One organization
   binds one mapping per record type and endpoint.
5. **Add a relation**: on the specification that points,
   `relations: { <name>: { type: "belongs_to", target: <the target's slug>, strict: false, alias: "<name>_id" } }`;
   its mapping writes the target's `external_id` under the alias. The target
   is described first in `ENTITIES`.
6. If the system streams changes, `watch` emits each with
   `ctx.events.upsert` / `ctx.events.delete`, observed when it happened.
7. The collector's configuration is its own: `inventoryCollector(config)`
   takes it, `src/index.ts` reads it from the deployment (add the variable to
   the secret in `deploy/` and to the README's table).
8. `mise run test` — `test/definitions.test.ts` evaluates every mapping on
   what a snapshot of the fixtures sends and validates it against its
   specification, so a mapping and its specification cannot drift — then
   `mise run describe`, then `np package publish --nrn organization=<id> --dry-run`.

## Rules that matter

- **Every slug is the package's.** The source type's slug is the package's
  (package.json `name`), each specification's `<package slug>-<record type>`
  (`specificationOf`). Never hardcode one: two collectors in one organization
  would write each other's definitions. Renaming the package starts new ones.
- **Definitions are the publisher's own.** Nothing here is `platform: true`:
  that marks one nullplatform publishes, which a tenant's publish only pins
  and fails on when it is missing.
- **Every mapping names its `endpoint`.** It is what publish binds (a
  destination); a record type with no bound mapping is not sent, and a run
  of only such types is refused.
- **Let errors propagate out of `snapshot`.** A snapshot that throws is aborted
  and deletes nothing. Catching an error and returning early looks like "these
  objects are gone" and deletes them.
- **A watch never returns on its own.** Ingest restarts a watch that returns or
  throws, after a backoff; one with nothing to watch waits for `ctx.signal`.
- **Observation time is ordering.** Snapshot records default to the snapshot's
  start; events carry the time the change happened (`observedAt`). The newest
  observation of an entity wins, whatever order inputs arrive in.
- **The source slug is identity.** Entities belong to the source that wrote
  them; only it can delete them. The source is the package's slug unless
  `src/index.ts` passes the `source` port (`{ slug, nrn, name }`); changing it
  starts a new source.
- **Ports are code, not environment.** The ingest (`ingest`, `ingestUrl`,
  `ingestToken`), the `source` and `intervalSeconds` are given to `main` in
  code; ingest's `ctx` carries no configuration. No variable switches a run to
  local: `src/local.ts` passes the in-memory ingest; the image runs
  `src/index.ts`.
- **Stdout is the answer.** A snapshot's result is printed as JSON; logs go to
  stderr through `ctx.log`. Never `console.log` in `snapshot` or `watch`.

## Verify

```bash
mise run test
mise run typecheck
mise run describe
mise run local
```
