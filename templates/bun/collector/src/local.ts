import { InMemoryIngest } from "@nullplatform/ingest/testing";
import { main, noopTracing, recordingPlatform, stderrLogger } from "@nullplatform/plugin";
import { inventoryCollector } from "./collector";

// A local run: the collector's own inventory, nothing to watch; nothing reaches catalog-ingest-api, the platform or the tracing API, and what each would get is told on stderr.
await main(inventoryCollector({}), { ingest: new InMemoryIngest({ log: stderrLogger }), fetch: recordingPlatform({ log: stderrLogger }).fetch, tracing: noopTracing });
