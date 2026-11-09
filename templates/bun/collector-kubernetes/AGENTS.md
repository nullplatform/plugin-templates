# AGENTS.md — {{ .Name }}

Rules for AI assistants and new contributors working in this **collector**.

## What this is

nullplatform's Kubernetes collector, `@nullplatform/collector-kubernetes`,
run as this package: `collectorDefinition(config)` from the library, defined
with `defineCollector` from `@nullplatform/plugin/collector` under the package
`package.json` declares, plus the package's own extension (`EXTENSION`, none
by default). The library owns reading the cluster (the backfill, the watch,
references and events); the SDK owns the run lifecycle, batching, retries and
the schedule. Nothing runs on import: `src/index.ts` reads the deployment's
settings (`configurationOf(process.env)`), resolves the cluster's source
(`resolveSource`) and runs `await main(collector, { ...ports, source })` —
`--describe` prints the manifest with every record type and asks the cluster
nothing, `NP_ACTION_CONTEXT='{}'` takes one snapshot, otherwise it serves
until SIGTERM. `src/local.ts` is the same with an in-memory ingest.

## File map

```
src/collector.ts         kubernetesCollector(config, { deps, extension }), EXTENSION
src/extension.ts         Extension, NO_EXTENSION, ownSlugOf(name), extended(definition, extension), namespaceOwners
src/mappings/*.jsonata   the extension's JSONata mappings
src/index.ts             configurationOf(process.env) + resolveSource, await main(collector, ports): the real ports
src/local.ts             the same on the current kube context, with InMemoryIngest, recordingPlatform().fetch, noopTracing
test/cluster.ts          fakeCluster (a KubeApi listing test/fixtures), snapshotOf(collector)
test/collector.test.ts   what describe publishes (14 + 1 + 14 pinned, 14 bound), a snapshot of the fake cluster
test/extension.test.ts   extended(): the example's mapping against its specification, the endpoint take-over, a CRD's records
deploy/collector.yaml    namespace, service account, read-only ClusterRole (+ events), Deployment
Dockerfile               the image: served by default, one snapshot with NP_ACTION_CONTEXT='{}'
mise.toml                describe · test · typecheck · build · local · dev · once · build:image · run · publish:image
```

## How to extend it

1. **An entity of what the collector already sends** (a namespace's owner, a
   deployment's team): an `Extension` with a specification (slug
   `ownSlugOf("<name>")`, an `external_id` with `primaryKey: true,
   autoGenerate: false`, snake_case properties) and a mapping keyed
   `ownSlugOf("<name>")`, `recordType` the record type it reads, `endpoint`
   the specification's slug. The record's payload is the Kubernetes object as
   the library sends it (`metadata`, `spec`, `status`, `_refs`, `_events`);
   `$source.slug` is the cluster. Return `{ id, data }`, or `null` to skip.
2. **A field**: add it to the extension's specification and its mapping's
   `data`; an optional one nullable (`["string", "null"]`), written `null`
   when missing (the catalog merges writes). nullplatform's `k8s-*`
   specifications are not yours to change.
3. **A CRD's kind**: an `Extension` with its specification, its mapping
   (`recordType` the kind, lowercase) and a `snapshot(ctx)` that yields
   `{ type, payload }` for each object (list it with the cluster client of
   your choice under `ctx.signal`); add the CRD's group and resource, `get,
   list, watch`, to the ClusterRole in `deploy/collector.yaml`. The library's
   watch does not watch it.
4. **A relation**: on your specification,
   `relations: { <name>: { type: "belongs_to", target: <the target's slug>, strict: false, alias: "<name>_id" } }`,
   the target's `external_id` under the alias in the mapping's `data`; the
   target described first.
5. **A mapping written where nullplatform's is** (yours of `pod` to
   `k8s-pod`): allowed; `extended()` publishes nullplatform's without that
   endpoint, since an organization binds one mapping per record type, target
   and endpoint (a second is refused, 409). An organization that already
   bound nullplatform's deletes that destination first.
6. Switch it on: `export const EXTENSION: Extension = <yours>;` in
   `src/collector.ts`. Test it as `test/extension.test.ts` does: a snapshot of
   `fakeCluster` (add fixtures), the mapping evaluated with `jsonata`, its
   output validated against the specification with `ajv`.

## Rules that matter

- **nullplatform's definitions are pinned, never written.** The `k8s-*`
  specifications, the `kubernetes` type and its mappings are `platform: true`:
  never copy one without it, never key an extension's mapping by one of their
  slugs (refused). Destinations are always the organization's.
- **Every slug of the package's own is `ownSlugOf(...)`.** Two packages in one
  organization would otherwise write each other's definitions.
- **Describe binds every record type.** `--describe` builds the collector
  with no configuration, so a shell's `K8S_*` never narrows what a publish
  binds; a deployment narrows what it collects, and its runs cover only that
  (an extension's mapping of a kind it does not collect is left out).
- **The source is the cluster's.** `resolveSource` picks
  `NP_COLLECTOR_SOURCE_SLUG`, else the cluster's own name; entities belong to
  the source that wrote them, so changing it starts a new source. Describe
  never resolves one.
- **Let errors propagate out of a snapshot.** One that throws is aborted and
  deletes nothing; one that returns early deletes what it did not send.
- **Settings are the environment's, read once.** `configurationOf` in the entry
  points; the collector's own code reads no variable. No variable switches a
  run to local: `src/local.ts` passes the in-memory ingest.
- **Stdout is the answer.** Logs go to stderr; never `console.log`.

## Verify

```bash
mise run test
mise run typecheck
mise run describe
mise run local      # needs a kube context: K8S_CONTEXT names a throwaway one
```
