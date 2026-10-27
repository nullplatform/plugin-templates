import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { InMemoryIngest } from "@nullplatform/ingest/testing";
import { serve } from "@nullplatform/plugin";
import { run } from "@nullplatform/plugin/testing";
import jsonata from "jsonata";
import manifest from "../package.json" with { type: "json" };
import collector, { inventoryCollector } from "../src/collector";

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

describe("{{ .Name }}", () => {
  test("the package is package.json's", () => {
    expect(collector.package).toMatchObject({ name: manifest.name, version: manifest.version, description: manifest.description });
  });

  test("describe tells the source, its mappings, its schedule and its watch", () => {
    expect(collector.manifest().collector).toMatchObject({
      source: { type: "inventory", name: "{{ .Name }}" },
      recordTypes: ["team"],
      mappings: { service: { target: "catalog", endpoint: "inventory-service" } },
      schedule: { intervalSeconds: 21_600 },
      watch: true,
    });
  });

  test("a snapshot sends every live service of its own inventory, and their teams", async () => {
    const ingest = new InMemoryIngest();
    const result = await run(collector, {}, { ports: { ingest } });
    expect(result.success).toBe(true);
    const [snapshot] = ingest.runs;
    expect(snapshot.status).toBe("completed");
    expect(payloadsOf(snapshot.records)).toEqual([
      { type: "service", payload: { id: "svc-1", name: "checkout", owner: "payments", retired: false } },
      { type: "team", payload: { name: "payments" } },
    ]);
    // One observation time for the whole listing: the snapshot's start.
    expect(new Set(snapshot.records.map((record) => record.observedAt)).size).toBe(1);
  });

  test("a snapshot reads the export it is given", async () => {
    const ingest = new InMemoryIngest();
    const result = await run(inventoryCollector({ inventoryUrl: fixture("inventory.json") }), {}, { ports: { ingest } });
    expect(result.success).toBe(true);
    expect(payloadsOf(ingest.runs[0].records).map(({ type, payload }) => `${type}:${(payload as { name: string }).name}`)).toEqual([
      "service:billing",
      "service:search",
      "team:payments",
      "team:discovery",
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
      ["upsert", "service", "checkout", "2026-01-01T10:00:00.000Z"],
      ["upsert", "team", "payments", "2026-01-01T10:00:00.000Z"],
      ["delete", "service", "search", "2026-01-01T10:05:00.000Z"],
      ["delete", "service", "billing", "2026-01-01T10:10:00.000Z"],
    ]);
  });

  // catalog-ingest-api evaluates the mappings; evaluating them here catches a mistake before a deploy.
  test("the service mapping makes a catalog entity in the source's region", async () => {
    const mapping = collector.manifest().collector as { mappings: { service: { expression: string } } };
    const entity = await jsonata(mapping.mappings.service.expression).evaluate(
      { id: "svc-1", name: "checkout", owner: "payments", retired: false },
      { source: { attributes: { region: "us-east-1" } } },
    );
    expect(entity).toEqual({ id: "svc-1", data: { external_id: "svc-1", name: "checkout", owner: "payments", region: "us-east-1" } });
  });
});
