import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { InMemoryIngest } from "@nullplatform/ingest/testing";
import { serve } from "@nullplatform/plugin";
import { run } from "@nullplatform/plugin/testing";
import manifest from "../package.json" with { type: "json" };
import collector, { inventoryCollector } from "../src/collector";
import { PACKAGE_SLUG, specificationOf } from "../src/definitions";

// run() answers one document the way the worker does: for a collector, `{}`
// is one snapshot. The ingest port is an InMemoryIngest, so nothing reaches
// catalog-ingest-api: what the snapshot sent is in `ingest.runs`, what the
// watch emitted in `ingest.emitted`. The inventory is read from the fixtures.
const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url).href;
const payloadsOf = (records: Array<{ type: string; payload: unknown }>) => records.map(({ type, payload }) => ({ type, payload }));

/** Resolves once `ready()` holds, polling; fails after `timeoutMs`. */
async function eventually(ready: () => boolean, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!ready()) {
    if (Date.now() > deadline) {
      throw new Error("timed out waiting");
    }
    await Bun.sleep(10);
  }
}

// A test that stubs the global fetch has it restored here.
afterEach(() => {
  mock.restore();
});

/** The manifest's components of `kind`, by name. */
const componentsOf = (kind: string) => collector.manifest().components.filter((component) => component.resource_type === kind);

describe(manifest.name, () => {
  test("the package is package.json's", () => {
    expect(collector.package).toMatchObject({ name: manifest.name, version: manifest.version, description: manifest.description });
  });

  test("describe tells the source, its type, the record types its mappings map, its schedule and its watch", () => {
    expect(collector.manifest().collector).toMatchObject({
      source: { type: PACKAGE_SLUG, name: "Inventory export" },
      recordTypes: ["team", "service"],
      entities: [specificationOf("team"), specificationOf("service")],
      sourceType: { slug: PACKAGE_SLUG, mappings: ["team", "service"] },
      schedule: { intervalSeconds: 21_600 },
      watch: true,
    });
  });

  // What `np package publish` creates in the organization: every component the publisher's own, none nullplatform's.
  test("describe publishes its specifications, its source type, the type's mappings and where each is written", () => {
    const { components } = collector.manifest();
    expect(components.map((component) => [component.resource_type, component.name])).toEqual([
      ["entity_specification", specificationOf("team")],
      ["entity_specification", specificationOf("service")],
      ["source_type", PACKAGE_SLUG],
      ["mapping", `${PACKAGE_SLUG}/team`],
      ["mapping", `${PACKAGE_SLUG}/service`],
      ["destination", `${PACKAGE_SLUG}/team/${specificationOf("team")}`],
      ["destination", `${PACKAGE_SLUG}/service/${specificationOf("service")}`],
    ]);
    expect(components.filter((component) => component.owner !== undefined)).toEqual([]);
    expect(componentsOf("destination").map((component) => component.resource)).toEqual([
      { mapping: "team", target: "catalog", endpoint: specificationOf("team") },
      { mapping: "service", target: "catalog", endpoint: specificationOf("service") },
    ]);
    // A mapping's body is the API's: where it is written goes in its destination, never in it.
    expect(componentsOf("mapping").map((component) => Object.keys(component.resource as object).sort())).toEqual([
      ["engine", "expression", "record_type", "slug"],
      ["engine", "expression", "record_type", "slug"],
    ]);
  });

  test("a snapshot sends every live service of its own inventory, after their teams", async () => {
    const ingest = new InMemoryIngest();
    const result = await run(collector, {}, { ports: { ingest } });
    expect(result.success).toBe(true);
    const [snapshot] = ingest.runs;
    expect(snapshot.status).toBe("completed");
    expect(payloadsOf(snapshot.records)).toEqual([
      { type: "team", payload: { name: "payments" } },
      { type: "service", payload: { id: "svc-1", name: "checkout", owner: "payments", retired: false } },
    ]);
    // One observation time for the whole listing: the snapshot's start.
    expect(new Set(snapshot.records.map((record) => record.observedAt)).size).toBe(1);
  });

  test("a snapshot reads the export it is given", async () => {
    const ingest = new InMemoryIngest();
    const result = await run(inventoryCollector({ inventoryUrl: fixture("inventory.json") }), {}, { ports: { ingest } });
    expect(result.success).toBe(true);
    expect(payloadsOf(ingest.runs[0].records).map(({ type, payload }) => `${type}:${(payload as { name: string }).name}`)).toEqual([
      "team:payments",
      "team:discovery",
      "service:billing",
      "service:search",
    ]);
  });

  test("an export that refuses aborts the snapshot: nothing is deleted", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(new Response("unavailable", { status: 503 }));
    const ingest = new InMemoryIngest();
    const result = await run(inventoryCollector({ inventoryUrl: "https://inventory.example.com/export" }), {}, { ports: { ingest } });
    expect(result.success).toBe(false);
    expect(result.failure?.message).toContain("answered 503");
    expect(ingest.runs[0].status).toBe("aborted");
  });

  test("served, the watch emits each change of the feed as it was observed", async () => {
    const ingest = new InMemoryIngest();
    const stop = new AbortController();
    const served = serve(inventoryCollector({ changesUrl: fixture("changes.jsonl") }), { ingest, signal: stop.signal });
    try {
      await eventually(() => ingest.emitted.length >= 4);
    } finally {
      stop.abort();
      await served;
    }
    expect(ingest.emitted.slice(0, 4).map(({ op, record }) => [op, record.type, (record.payload as { name: string }).name, record.observedAt])).toEqual([
      ["upsert", "team", "payments", "2026-01-01T10:00:00.000Z"],
      ["upsert", "service", "checkout", "2026-01-01T10:00:00.000Z"],
      ["delete", "service", "search", "2026-01-01T10:05:00.000Z"],
      ["delete", "service", "billing", "2026-01-01T10:10:00.000Z"],
    ]);
  });
});
