import type { KubeApi } from "@nullplatform/collector-kubernetes";
import { InMemoryIngest } from "@nullplatform/ingest/testing";
import { run } from "@nullplatform/plugin/testing";
import namespaces from "./fixtures/namespaces.json" with { type: "json" };
import type { Plugin } from "@nullplatform/plugin";
import type { CollectorPorts } from "@nullplatform/plugin/collector";

/** The objects of the fake cluster, by kind: two namespaces, one with a team label. */
const OBJECTS: Record<string, unknown[]> = { namespace: namespaces };

/** A cluster that lists the fixtures, one page per kind, and never changes: what a test's collector reads in place of a real one. */
export const fakeCluster = (): KubeApi => ({
  context: "fake",
  async *list(type) {
    yield { items: (OBJECTS[type.kind] ?? []) as never[], resourceVersion: "1" };
  },
  watch: async () => {},
});

/** The source a test's snapshot feeds, as the deployment would resolve it. */
export const SOURCE = { slug: "test-cluster" };

/** Every record one snapshot of `collector` sends, against an in-memory ingest. */
export async function snapshotOf(collector: Plugin<CollectorPorts>) {
  const ingest = new InMemoryIngest();
  const result = await run(collector, {}, { ports: { ingest, source: SOURCE } });
  if (!result.success) {
    throw new Error(`the snapshot failed: ${result.failure?.message}`);
  }
  return ingest.runs[0].records;
}
