/**
 * A collector: reads a system of record (here, an inventory export) and feeds
 * the catalog through catalog-ingest-api. One snapshot answers a document;
 * served, it snapshots on its schedule and watches the inventory's change
 * feed. Its own configuration is its code's: a function of it builds the
 * collector, and the entry points (index.ts, local.ts) say what it is.
 * Nothing runs on import.
 *
 * Replace the inventory with your system of record: `snapshot` yields one raw
 * record per object it holds right now, `watch` emits the changes as they
 * happen; shaping a record into a catalog entity is the mapping's.
 */

import { DeletePolicy, Engine, type CollectorEvents } from "@nullplatform/ingest";
import { defineCollector } from "@nullplatform/plugin/collector";
import manifest from "../package.json" with { type: "json" };

/** Where the collector reads its inventory: what its entry point builds it with. */
export interface InventoryConfig {
  /** Where the inventory export lives; the collector's own inventory without it. */
  inventoryUrl?: string;
  /** Where the inventory streams its changes, one JSON line each; nothing to watch without it. */
  changesUrl?: string;
}

/** A service as the inventory lists it, with the team that owns it. */
interface InventoryRecord {
  id: string;
  name: string;
  owner: string;
  retired: boolean;
}

/** A team, as the collector sends it: the owner of a service. */
interface TeamRecord {
  name: string;
}

/** A change the inventory's feed streams: what happened to a record, and when. */
interface InventoryChange {
  change: "upsert" | "delete";
  record: InventoryRecord;
  at: string;
}

/** The inventory when no export is given. */
const OWN_INVENTORY: InventoryRecord[] = [
  { id: "svc-1", name: "checkout", owner: "payments", retired: false },
  { id: "svc-2", name: "legacy-cart", owner: "storefront", retired: true },
];

/** The records the export at `url` lists, read under `signal`, the collector's own inventory without one; an export that refuses fails the snapshot. */
async function inventoryOf(url: string | undefined, signal: AbortSignal): Promise<InventoryRecord[]> {
  if (url === undefined) {
    return OWN_INVENTORY;
  }
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`the inventory export at ${url} answered ${response.status}`);
  }
  return (await response.json()) as InventoryRecord[];
}

/** The teams that own `services`, each once. */
function teamsOf(services: InventoryRecord[]): TeamRecord[] {
  return [...new Set(services.map((service) => service.owner))].map((name) => ({ name }));
}

/** The changes the feed at `url` streams, read under `signal`, in the batches they arrive in, one JSON line each; a feed that refuses throws. */
async function* changeBatchesOf(url: string, signal: AbortSignal): AsyncGenerator<InventoryChange[]> {
  const response = await fetch(url, { signal });
  if (!response.ok || response.body === null) {
    throw new Error(`the change feed at ${url} answered ${response.status}`);
  }
  const decoder = new TextDecoder();
  let partial = "";
  for await (const chunk of response.body) {
    const lines = (partial + decoder.decode(chunk, { stream: true })).split("\n");
    partial = lines.pop() ?? "";
    yield lines.filter((line) => line.trim() !== "").map((line) => JSON.parse(line) as InventoryChange);
  }
}

/** Emits `change` as the catalog takes it, observed when the feed says: a service retired or deleted is deleted; any other is upserted, with its team. */
function emitted(events: CollectorEvents, { change, record, at }: InventoryChange): void {
  if (change === "delete" || record.retired) {
    events.delete("service", record, { observedAt: at });
    return;
  }
  events.upsert("service", record, { observedAt: at });
  events.upsert("team", { name: record.owner } satisfies TeamRecord, { observedAt: at });
}

/** What resolves once `signal` aborts: at once if it already has. */
function untilAborted(signal: AbortSignal): Promise<void> {
  const aborted = Promise.withResolvers<void>();
  signal.addEventListener("abort", () => aborted.resolve(), { once: true });
  return signal.aborted ? Promise.resolve() : aborted.promise;
}

/** The collector of the inventory `config` names. */
export function inventoryCollector(config: InventoryConfig) {
  return defineCollector({
    // The package, as package.json declares it: baked in at build time. Its slug is also the source's, unless the entry point's source port says another.
    package: { name: manifest.name, version: manifest.version, description: manifest.description },
    source: {
      // The source type's slug: what kind of system this is. Its shared mappings are the organization's.
      type: "inventory",
      name: "{{ .Name }}",
      description: "The services an inventory export lists, and the teams that own them",
      // The organization's own data about the source, read by a mapping as `$source.attributes`.
      attributes: { region: "us-east-1" },
      runs: {
        // A snapshot not finished within an hour is aborted.
        ttlSeconds: 3600,
        // A finished snapshot deletes what it no longer saw: a retired service leaves the catalog.
        deletePolicy: DeletePolicy.SOFT_DELETE_STALE,
        // A snapshot that would delete half the entities or more is refused.
        maxDeleteRatio: 0.5,
        // A snapshot that listed nothing is refused: an empty export is a broken one.
        rejectEmpty: true,
      },
    },
    // A type the inventory source type's shared mappings map: the organization binds it to its endpoints once.
    recordTypes: ["team"],
    mappings: {
      // The collector's own type: its mapping is evaluated by catalog-ingest-api, and `data` must satisfy the endpoint's schema.
      service: {
        engine: Engine.JSONATA,
        // Each service an entity of its id, in the region the source's attributes name.
        expression: '{ "id": id, "data": { "external_id": id, "name": name, "owner": owner, "region": $source.attributes.region } }',
        // Where the entities go: the catalog, and its endpoint, a specification's slug.
        target: "catalog",
        endpoint: "inventory-service",
        // Written while true: false stops writing the mapping's entities, the mapping kept.
        enabled: true,
      },
    },
    // With a watch, a resync: every six hours a snapshot catches what the watch missed while it was down.
    schedule: { intervalSeconds: 21_600 },
    // Everything the system of record holds right now. A snapshot that throws is aborted and deletes nothing: let errors propagate.
    async *snapshot(ctx) {
      const services = (await inventoryOf(config.inventoryUrl, ctx.signal)).filter((service) => !service.retired);
      // What the snapshot found, as of when it started: its records are observed then, unless one says otherwise.
      ctx.log.info(`${services.length} service(s) in source ${ctx.source.slug} as of ${ctx.observedAt.toISOString()}`);
      for (const service of services) {
        yield { type: "service", payload: service };
      }
      for (const team of teamsOf(services)) {
        yield { type: "team", payload: team };
      }
    },
    // The changes as they happen, until the collector stops; ingest restarts a watch that throws or returns, after a backoff.
    async watch(ctx) {
      const url = config.changesUrl;
      if (url === undefined) {
        // Nothing to watch: it waits for the stop, since a watch that returns at once is restarted.
        return untilAborted(ctx.signal);
      }
      for await (const batch of changeBatchesOf(url, ctx.signal)) {
        batch.forEach((change) => emitted(ctx.events, change));
        // Each batch sent as it arrives, not a second later.
        await ctx.events.flush();
      }
    },
  });
}

/** The collector of its own inventory, with nothing to watch: what a local run builds. */
export default inventoryCollector({});
