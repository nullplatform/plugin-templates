import { main } from "@nullplatform/plugin";
import { inventoryCollector } from "./collector";

// The deployment's own configuration, read here (the library reads none); a blank variable gives none.
const collector = inventoryCollector({ inventoryUrl: process.env.INVENTORY_URL || undefined, changesUrl: process.env.INVENTORY_CHANGES_URL || undefined });

// What runs in the image: the real ports (catalog-ingest-api with the platform API key, the platform API, the tracing API).
// One deployment per system collected from gives each its own source in code: main(collector, { source: { slug: "…" } }).
await main(collector);
