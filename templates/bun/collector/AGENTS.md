# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this **collector**.

## What this is

A collector defined with `defineCollector` from
`@nullplatform/plugin/collector`, on `@nullplatform/ingest`. It reads a system
of record and feeds the catalog through catalog-ingest-api: full **snapshots**
(reconciled, so what disappeared is deleted) and a **watch** (the changes as
they happen). The SDK owns the run lifecycle, batching, retries and the
schedule; you write `snapshot`, `mappings` and `watch`. Nothing runs on import:
`src/index.ts` is `await main(collector)` — `--describe` prints the manifest,
`NP_ACTION_CONTEXT='{}'` takes one snapshot, otherwise it serves (a snapshot
every interval, plus the watch) until SIGTERM. `src/local.ts` is the same with
an in-memory ingest.

## File map

```
src/collector.ts        inventoryCollector(config): package, source, recordTypes, mappings, schedule, snapshot, watch
src/index.ts            reads INVENTORY_URL / INVENTORY_CHANGES_URL, await main(collector): the real ports
src/local.ts            await main(inventoryCollector({}), { ingest: new InMemoryIngest(), fetch: recordingPlatform().fetch, tracing: noopTracing })
test/fixtures/          an inventory export and a change feed
test/collector.test.ts  run(collector, {}, { ports: { ingest } }), serve() for the watch, the mapping through jsonata
Dockerfile              the image: served by default, one snapshot with NP_ACTION_CONTEXT='{}'
mise.toml               describe · test · typecheck · build · local · dev · once · build:image · run · publish:image
```

## How to change it

1. Replace the inventory in `src/collector.ts` with your system of record:
   `snapshot` yields one `{ type, payload }` per object it holds. Keep payloads
   raw — shaping belongs in the mapping.
2. Write one mapping per record type the collector owns. It names where it
   writes: a `target` (`catalog`) and an `endpoint` of it by slug (for the
   catalog, a specification's slug: each organization has its own ids). The
   expression returns `{ id, data }` (a list, or `null` to skip the record);
   `data` must satisfy the endpoint's schema, primary key included. A type the
   source type's shared mappings map goes in `recordTypes` instead.
3. If the system streams changes, `watch` emits each with
   `ctx.events.upsert` / `ctx.events.delete`, observed when it happened.
4. The collector's configuration is its own: `inventoryCollector(config)`
   takes it, `src/index.ts` reads it from the deployment. Ingest's context
   carries none (`@nullplatform/ingest` 0.0.6 removed its `settings` slot).
5. Add tests: a snapshot through `run(collector, {}, { ports: { ingest } })`
   against an `InMemoryIngest`, the watch through `serve`, the mapping
   evaluated on a sample payload.
6. `mise run test`, then `mise run local` (in memory) or `mise run once` (real).

## Rules that matter

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
  code. No variable switches a run to local: `src/local.ts` passes the
  in-memory ingest; the image runs `src/index.ts`.
- **Stdout is the answer.** A snapshot's result is printed as JSON; logs go to
  stderr through `ctx.log`. Never `console.log` in `snapshot` or `watch`.

## Verify

```bash
mise run test
mise run typecheck
mise run describe
mise run local
```
