# {{ .Name }}

nullplatform's **Kubernetes collector**
([`@nullplatform/collector-kubernetes`](https://www.npmjs.com/package/@nullplatform/collector-kubernetes))
as a package of your own: it keeps the catalog in sync with every cluster it
runs in — namespaces, nodes, workloads, pods, services, ingresses, config
maps, volume claims and their events — through catalog-ingest-api. A backfill
on start, every change as it happens (the watch), and a resync once a day.

It runs the library as it is, and is ready to extend: your own entities and
mappings beside nullplatform's (`src/extension.ts`), off until you switch one
on.

What its records become is **nullplatform's**: the 14 `k8s-*` catalog
specifications, the `kubernetes` source type and its 14 mappings. Your
publish pins them as they are and **binds** each mapping in your organization
(14 destinations, yours), so every cluster's records reach the catalog.

## What to edit

| File | What it is |
|---|---|
| `src/collector.ts` | `kubernetesCollector(config)`: the library's collector, under this package (from `package.json`), with `EXTENSION` |
| `src/extension.ts` | what the package adds: `extended()`, and `namespaceOwners`, an extension ready to switch on |
| `src/mappings/*.jsonata` | the extension's mappings |
| `src/index.ts` | what the image runs: the settings from the environment, the cluster's source, `await main(collector)` |
| `src/local.ts` | the same, on your current kube context, with an in-memory ingest: nothing reaches catalog-ingest-api or the platform |
| `test/` | the definitions it publishes, a snapshot of a fake cluster (`test/fixtures/`), the extension |
| `deploy/collector.yaml` | the namespace, a read-only ClusterRole, the service account and the Deployment |

## 1. Prerequisites

- **nullplatform has published the Kubernetes definitions** (the `k8s-*`
  specifications, the `kubernetes` type and its mappings). Your publish pins
  them; when one is missing it stops there, before binding anything or
  registering the package: `<kind> <name> is nullplatform's and is not
  published yet`.
- The nullplatform CLI, `np`, newer than 2.13.0: its `np package publish`
  publishes a collector's definitions (`np upgrade`).
- [mise](https://mise.jdx.dev) (`brew install mise`); it installs bun.
- Docker with buildx, logged in to a registry your clusters can pull from.
- `kubectl`, with access to each cluster to collect (cluster-admin to apply
  the ClusterRole).
- Two API keys of the organization:
  - **to publish**: an organization admin's key. It reads nullplatform's
    definitions, binds the mappings (catalog-ingest-api's
    `organization:ingest_admin`, which an organization's `admin` and `ops`
    roles hold) and registers the package.
  - **to run**: the collector's own key, granted `organization:machine:ingest`
    at the NRN its sources live at (the organization's root unless
    `NP_COLLECTOR_SOURCE_NRN` says otherwise):

    ```bash
    np api-key create --body '{"name":"{{ .Slug }}","grants":[{"nrn":"organization=<id>","role_slug":"organization:machine:ingest"}]}'
    ```

## 2. Develop and test

```bash
mise trust && mise install
mise run test       # the definitions it publishes, a snapshot of a fake cluster, the extension; no cluster
mise run typecheck
mise run describe   # the manifest np package publish reads
mise run local      # one snapshot of your current kube context (K8S_CONTEXT names another): prints, sends nothing
mise run dev        # served on it, against the in-memory ingest, with hot reload, until Ctrl-C
```

## 3. Publish

Once per organization, and again for each new version:

```bash
export NP_API_KEY=<an organization admin's API key>
np package publish --nrn organization=<id> --dry-run   # every component as it would be sent; asks the API nothing

export NP_PUSH_REGISTRY=<registry>/<repository>         # e.g. ghcr.io/<owner>/{{ .Slug }}
IMAGE=$(mise run publish:image)                         # builds + pushes the image, prints <registry>/<repository>@sha256:<digest>
np package publish --nrn organization=<id> --image "$IMAGE"
```

| Component | Owner | What publish does |
|---|---|---|
| `entity_specification` `k8s-*` (14) | nullplatform | looks each up and pins it; stops if one is missing |
| `source_type` `kubernetes` | nullplatform | looks it up and pins it |
| `mapping` `kubernetes/<record type>` (14) | nullplatform | looks each up and pins it |
| `destination` `kubernetes/<record type>/k8s-<record type>` (14) | your organization | binds each mapping to its specification for every cluster's source; one found is kept |
| the extension's specifications, mappings and destinations | your organization | created, then updated (none until you switch one on) |
| package `{{ .Slug }}` | your organization | a revision pinning the image |

Its describe binds every record type, whatever `K8S_*` your shell has: a
cluster that collects less sends less; one that collects more never finds a
type unbound.

## 4. Deploy

In each cluster to collect:

```bash
kubectl create namespace {{ .Slug }}
kubectl -n {{ .Slug }} create secret generic {{ .Slug }} \
  --from-literal=NP_API_KEY=<the collector's API key>
sed "s|COLLECTOR_IMAGE|$IMAGE|" deploy/collector.yaml | kubectl apply -f -
```

The source is the cluster's own name (the GKE or OCI metadata server, an EKS
or AKS node label, else the `kube-system` namespace's uid): add
`--from-literal=NP_COLLECTOR_SOURCE_SLUG=<slug>` to name it yourself. Every
key of the secret is a setting:

| Variable | Setting | Default |
| --- | --- | --- |
| `NP_API_KEY` | the collector's API key, exchanged for catalog-ingest-api's token | none: required |
| `NP_API_URL` | the platform API | `https://api.nullplatform.com` |
| `NP_INGEST_API_URL` | catalog-ingest-api's URL | `<NP_API_URL>/catalog/ingest` |
| `NP_COLLECTOR_SOURCE_SLUG` | the source's slug: the `cluster` of its entities and their `key` prefix; never change it once it runs | the cluster's own name |
| `NP_COLLECTOR_SOURCE_NAME` | the source's display name | `Kubernetes cluster` |
| `NP_COLLECTOR_SOURCE_NRN` | where the source lives; never changed once it exists | the organization's root |
| `NP_COLLECTOR_INTERVAL_SECONDS` | seconds between resyncs after the backfill; `0`: none | 86400, a day |
| `K8S_RESOURCES` | comma-separated record types to collect (`pod,deployment,…`) | every one |
| `K8S_EXCLUDE_NAMESPACES` | comma-separated namespaces to ignore | none |
| `K8S_CONTEXT` | a kubeconfig context other than the current one, outside a cluster | the current one |
| `K8S_PAGE_SIZE` | objects per list request | 500 |
| `K8S_WATCH_WINDOW_SECONDS` | seconds a watched object's change waits for its next one (only the latest is sent); `0`: each at once | 5 |
| `K8S_EVENTS` | `false` reads no events (a service account that cannot list them) | `true` |
| `K8S_EVENT_TYPES` | `Warning`, `Normal` or both | `Warning` |
| `K8S_EVENT_REFRESH_SECONDS` | seconds an event that only repeats waits to be sent again; `0`: every repeat | 300 |
| `K8S_EVENT_NORMAL_REASONS` | the reasons the Normal events read are narrowed to (`SuccessfullyReconciled`); only with `Normal` in `K8S_EVENT_TYPES` | every Normal event |

The library's README documents each in full. One replica per cluster: a
restart resumes the watches at once. To take one snapshot per run instead,
run the image as a CronJob with `NP_ACTION_CONTEXT='{}'` beside the secret.

## 5. Verify

```bash
kubectl -n {{ .Slug }} logs deploy/{{ .Slug }}   # "source <slug> (<where from>)", then the backfill's counts and "completed"

TOKEN=$(curl -s https://api.nullplatform.com/token -H 'content-type: application/json' \
  -d "{\"api_key\":\"$NP_API_KEY\"}" | jq -r .access_token)
api() { curl -s -H "Authorization: Bearer $TOKEN" "https://api.nullplatform.com/catalog/ingest$1"; }
SOURCE=$(api "/sources?slug=<the source slug from the log>" | jq -r '.results[0].id')
api "/sources/$SOURCE/runs" | jq '.results[] | {id, status, counters}'                       # its runs
api "/sources/$SOURCE/entities?record_type=deployment" | jq '.results[] | {endpoint, external_id}'  # what it wrote
```

The entities show in the console's catalog, under the Kubernetes
specifications' names.

## 6. Extend it

An extension adds the package's own definitions beside nullplatform's, all
named after the package's slug (`ownSlugOf`):

- **an entity of data the collector already sends**: `namespaceOwners` in
  `src/extension.ts` — a specification `{{ .Slug }}-namespace-owner` and a
  mapping of the `namespace` records to it, from each namespace's `team`
  label. Switch it on with `export const EXTENSION: Extension = namespaceOwners;`
  in `src/collector.ts`.
- **a CRD's kind**: an `Extension` with its specification, its mapping
  (`recordType` the kind's) and a `snapshot` that lists the CRD's objects; add
  its group and resource to the ClusterRole in `deploy/collector.yaml`. The
  library's watch does not watch it: the snapshot (daily, or
  `NP_COLLECTOR_INTERVAL_SECONDS`) keeps it current.
- **a mapping of a record type written where nullplatform's is** (your own
  `pod` mapping to `k8s-pod`): an organization binds one mapping per record
  type and endpoint, so `extended()` publishes nullplatform's without its
  endpoint and yours with it. If your organization already bound
  nullplatform's, delete that destination first
  (`DELETE /catalog/ingest/destinations/{id}`, found with
  `GET /catalog/ingest/source_types/{id}/destinations?mapping=pod&target=catalog&endpoint=k8s-pod`):
  the publish is refused (409) while it is there.

Then:

```bash
mise run test                                                      # the extension's mapping against its specification
np package publish --nrn organization=<id> --dry-run               # the extension's components, yours
IMAGE=$(mise run publish:image) && np package publish --nrn organization=<id> --image "$IMAGE"
sed "s|COLLECTOR_IMAGE|$IMAGE|" deploy/collector.yaml | kubectl apply -f -   # in each cluster
```

Cutting a GitHub Release runs `.github/workflows/release.yml`: tests, then
`np package publish` from CI (secret `NULLPLATFORM_API_KEY`, variable
`NP_NRN=organization=<id>`).

## Troubleshooting

| What you see | Why | Fix |
| --- | --- | --- |
| publish fails: `<kind> k8s-… is nullplatform's and is not published yet` | nullplatform has not published the Kubernetes definitions where your organization can read them | ask nullplatform, then publish again (what it already wrote, an extension's specification or the pushed image, is reused) |
| the collector fails: `source type 'kubernetes' does not exist (GET /source_types lists the ones there are)` | the same, seen from a running collector | the same |
| `no mapping is bound to a destination on source '…' for record type(s): …`, or `no record type of this collector is bound for source …` | the package is not published in the collector's organization, so nothing is bound | publish it (3) with a key of the organization the collector's key belongs to |
| the log says `not bound for this source, not sent: …` | some record types are unbound: a destination deleted, or a publish taken from an older version | publish again |
| publish refused (`409`): `record type '…' already goes to '…' in this scope (…)` | an extension's mapping is written where nullplatform's already is bound | delete that destination (6), publish again |
| `403` `insufficient permissions to access the requested resource` | the key lacks its role: publishing needs an organization admin's key; the collector's needs `organization:machine:ingest` at its sources' NRN | grant it (1), or use the right key |
| `cannot list …: … forbidden` | the ClusterRole misses a resource (a CRD's), or events | add it to `deploy/collector.yaml`, or set `K8S_EVENTS=false` |
| the collector crashes at start asking for credentials | no `NP_API_KEY` in its environment | add it to the secret (4) |
| two clusters write one source | they resolved the same slug | set `NP_COLLECTOR_SOURCE_SLUG` per cluster |

New to the code? Read `AGENTS.md`.
