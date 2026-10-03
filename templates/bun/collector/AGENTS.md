# AGENTS.md — {{ .Name }}

Guidance for AI agents / new contributors working in this **collector** package.

## What this is

A collector defined with `defineCollector({...})` from
`@nullplatform/plugin/collector`. It reads a system of record and feeds the
catalog through catalog-ingest-api: full **snapshots** (reconciled, so what
disappeared is deleted) and, optionally, a **watch** (deltas). The SDK owns the
run lifecycle, batching, retries, scheduling and how the process is started;
you write `snapshot`, `mappings` and optionally `watch`.

## File map

```
src/collector.ts         the definition: source, mappings, snapshot (and watch)
src/index.ts             defineCollector(collector) — process entry point
config/                  node-config: defaults + env var mapping (collector.settings)
data/inventory.json      the example's input
test/collector.test.ts   snapshot + mapping tests (in-memory ingest, no network)
Dockerfile               the image (default command: --run)
mise.toml                tasks: test, dev, once, describe, build:image, run, publish:image
```

## How to change it

1. Replace `snapshot` in `src/collector.ts` with your system of record: yield
   one `{ kind, payload }` per object it holds. Keep payloads raw — shaping
   belongs in the mapping.
2. Write one mapping per record kind. It must return `{ id, data }` (a list, or
   `null` to skip the record). `data` must satisfy the target specification,
   primary key included. Declare optional properties nullable in the
   specification: a field that disappears from your mapping is then cleared
   (written as null); a non-nullable one keeps its last value, because the
   catalog merges writes. Relations to other entities: write the target's
   external id under the foreign-key alias; declare such relations
   `strict: false` with an explicit `alias: "<x>_id"` in the specification.
3. Add a test that runs `runSnapshot` against `InMemoryIngest` and one that
   evaluates the mapping on a sample payload.
4. `mise run test`, then `mise run dev` (in-memory) or `mise run once` (real API).

## Rules that matter

- **Let errors propagate out of `snapshot`.** A snapshot that throws is aborted
  and deletes nothing. Catching an error and returning early looks like "these
  objects are gone" and deletes them.
- **Observation time is ordering.** Snapshot records default to the snapshot's
  start; events should carry the time the change happened (`observedAt`). The
  newest observation of an entity wins, whatever order inputs arrive in.
- **The source id is identity.** Entities belong to the source that wrote them;
  only it can delete them. Changing `NP_COLLECTOR_SOURCE_ID` starts a new
  source.
- **Never set `NP_MODE=dev` in the image** — it switches to the in-memory ingest
  and sends nothing.
- Stdout is reserved for results (`--once` prints JSON); logs go to stderr via
  `ctx.log`.
