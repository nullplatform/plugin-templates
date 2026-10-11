import { readFile } from "node:fs/promises";
import pkg from "../package.json";
import type { CollectorDefinition } from "@nullplatform/plugin/collector";

// What this collector reads. Settings come from node-config: `collector.settings`
// in config/default.json, overridable per deployment by environment variables
// (see config/custom-environment-variables.json).
export interface Settings {
  inventoryFile: string;
}

interface InventoryEntry {
  name: string;
  team: string;
  tier: string;
  repository?: string;
}

// The example reads a CMDB-style export (a JSON file). Replace `snapshot` with
// your system of record: list everything it holds, one record per object.
export const collector: CollectorDefinition<Settings> = {
  name: "{{ .Slug }}",
  version: pkg.version,
  description: "{{ .Name }}: feeds the catalog from a system of record",

  // The ingest source this collector feeds. Its slug defaults to the package
  // name; set NP_COLLECTOR_SOURCE_SLUG to run one deployment per environment.
  source: {
    type: "inventory",
    name: "{{ .Name }}",
    // A snapshot that would delete half the source or more is refused.
    maxDeleteRatio: 0.5,
  },

  // How each record type becomes catalog entities. Evaluated by
  // catalog-ingest-api; `data` must satisfy the schema of the type it writes
  // to. Returning null filters the record out.
  mappings: {
    service: {
      engine: "jsonata",
      // Where the entities are written: a target (a backend the platform
      // configured; "catalog" is the default and today the only one) and a
      // type of it, by slug (for the catalog, a specification's slug).
      target: "catalog",
      typeSlug: "inventory-service",
      expression: `tier = "retired" ? null : {
        "id": name,
        "data": {
          "external_id": name,
          "name": name,
          "team": team,
          "tier": tier,
          "repository": repository
        }
      }`,
    },
  },

  // Default for long-running workers; NP_COLLECTOR_INTERVAL_SECONDS overrides.
  schedule: { intervalSeconds: 3600 },

  // Everything the system of record holds right now. Throwing aborts the
  // snapshot and nothing is deleted, so let errors propagate.
  async *snapshot(ctx) {
    const entries = JSON.parse(await readFile(ctx.settings.inventoryFile, "utf-8")) as InventoryEntry[];
    ctx.log.detail(`${entries.length} entries in ${ctx.settings.inventoryFile}`);
    for (const entry of entries) {
      yield { type: "service", payload: entry };
    }
  },

  // Optional: stream changes as they happen (webhooks, watch APIs, CDC) until
  // ctx.signal aborts. Snapshots still run on schedule and catch what it missed.
  //
  // async watch(ctx) {
  //   for await (const change of subscribe(ctx.signal)) {
  //     if (change.type === "deleted") ctx.events.delete("service", change.entry, { observedAt: change.at });
  //     else ctx.events.upsert("service", change.entry, { observedAt: change.at });
  //   }
  // },
};
