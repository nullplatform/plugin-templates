import { describe, test, expect } from "bun:test";
import jsonata from "jsonata";
import { InMemoryIngest, createActionLogger, runSnapshot } from "@nullplatform/plugin/collector";
import { collector } from "../src/collector";

const log = createActionLogger(() => {});
const settings = { inventoryFile: "test/fixtures/inventory.json" };

describe("{{ .Name }} collector", () => {
  test("a snapshot sends every inventory entry, then reconciles", async () => {
    const ingest = new InMemoryIngest({ echo: false });
    const result = await runSnapshot(collector, ingest, { sourceSlug: "test", settings, log });

    expect(result.status).toBe("completed");
    const [run] = ingest.runs;
    expect(run.types).toEqual(["service"]);
    expect(run.records.map((r) => (r.payload as { name: string }).name)).toEqual([
      "billing",
      "legacy-reports",
    ]);
    // One consistent observation time for the whole listing.
    expect(new Set(run.records.map((r) => r.observedAt)).size).toBe(1);
  });

  test("an unreadable inventory aborts the snapshot: nothing is deleted", async () => {
    const ingest = new InMemoryIngest({ echo: false });
    await expect(
      runSnapshot(collector, ingest, { sourceSlug: "test", settings: { inventoryFile: "missing.json" }, log }),
    ).rejects.toThrow();
    expect(ingest.runs[0].status).toBe("aborted");
  });

  // The API evaluates mappings; evaluating them here catches mistakes before a deploy.
  test("the service mapping produces catalog entities and filters retired entries", async () => {
    const mapping = jsonata(collector.mappings.service.expression);
    const bindings = {
      source: { id: "0199c1d2-0000-7000-8000-000000000000", slug: "test", type: "inventory" },
      run: { id: null, mode: "full" },
    };
    expect(
      await mapping.evaluate(
        { name: "billing", team: "payments", tier: "critical", repository: "https://github.com/acme/billing" },
        bindings,
      ),
    ).toEqual({
      id: "billing",
      data: {
        external_id: "billing",
        name: "billing",
        team: "payments",
        tier: "critical",
        repository: "https://github.com/acme/billing",
      },
    });
    expect(await mapping.evaluate({ name: "old", team: "x", tier: "retired" }, bindings)).toBeNull();
  });
});
