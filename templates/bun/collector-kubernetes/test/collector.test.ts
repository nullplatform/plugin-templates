import { describe, expect, test } from "bun:test";
import { ENTITIES, SOURCE_TYPE } from "@nullplatform/collector-kubernetes";
import manifest from "../package.json" with { type: "json" };
import { kubernetesCollector } from "../src/collector";
import { fakeCluster, snapshotOf } from "./cluster";

// The package runs nullplatform's Kubernetes collector as it is: its describe
// pins nullplatform's definitions and binds every mapping in the publisher's
// organization; a snapshot reads the cluster (here a fake one, the fixtures)
// and sends each object as a record. Nothing reaches catalog-ingest-api.

/** What a describe of `collector` says it publishes: each component's kind, name and owner. */
const componentsOf = (collector: ReturnType<typeof kubernetesCollector>) =>
  collector.manifest().components.map((component) => ({ kind: component.resource_type, name: component.name, owner: component.owner }));

/** Every record type nullplatform's type maps, in the collector's order (the kinds it reads, then events). */
const RECORD_TYPES = (kubernetesCollector().manifest().collector as { recordTypes: string[] }).recordTypes;

/** What `bun src/index.ts --describe` prints with `environment` over this process's: the manifest publish reads. */
function described(environment: Record<string, string>) {
  const described = Bun.spawnSync(["bun", "src/index.ts", "--describe"], { cwd: new URL("..", import.meta.url).pathname, env: { ...process.env, ...environment } });
  expect(described.stderr.toString()).toBe("");
  return JSON.parse(described.stdout.toString()) as { slug: string; components: Array<{ resource_type: string; owner?: string }> };
}

describe(manifest.name, () => {
  test("the package is package.json's", () => {
    expect(kubernetesCollector().package).toMatchObject({ name: manifest.name, version: manifest.version, description: manifest.description });
  });

  test("describe pins nullplatform's 14 specifications, its type and 14 mappings, and binds the 14 in the organization", () => {
    const components = componentsOf(kubernetesCollector());
    const of = (kind: string) => components.filter((component) => component.kind === kind);
    expect([...RECORD_TYPES].sort()).toEqual(Object.keys(SOURCE_TYPE.mappings).sort());
    expect(RECORD_TYPES).toHaveLength(14);
    expect(of("entity_specification")).toEqual(ENTITIES.map((specification) => ({ kind: "entity_specification", name: specification.slug, owner: "platform" })));
    expect(of("source_type")).toEqual([{ kind: "source_type", name: "kubernetes", owner: "platform" }]);
    expect(of("mapping")).toEqual(RECORD_TYPES.map((type) => ({ kind: "mapping", name: `kubernetes/${type}`, owner: "platform" })));
    // Where each is written is the organization's own: never nullplatform's.
    expect(of("destination")).toEqual(RECORD_TYPES.map((type) => ({ kind: "destination", name: `kubernetes/${type}/k8s-${type}`, owner: undefined })));
    expect(components).toHaveLength(14 + 1 + 14 + 14);
  });

  test("the entry point's describe binds every record type, whatever K8S_* narrows a deployment to", () => {
    const manifestOf = described({ K8S_RESOURCES: "pod", K8S_EVENTS: "false", K8S_EVENT_TYPES: "nonsense" });
    expect(manifestOf.slug).toBe(manifest.name);
    expect(manifestOf.components.filter((component) => component.resource_type === "destination")).toHaveLength(14);
  });

  test("a deployment's settings narrow what it collects, and so the record types its runs cover", () => {
    const narrowed = kubernetesCollector({ resources: ["namespace", "pod"], events: { enabled: false } });
    expect(narrowed.manifest().collector).toMatchObject({ recordTypes: ["namespace", "pod"], sourceType: { slug: "kubernetes", mappings: ["namespace", "pod"] } });
  });

  test("a snapshot sends every object of the cluster as a record of its kind", async () => {
    const records = await snapshotOf(kubernetesCollector({ resources: ["namespace"], events: { enabled: false } }, { deps: { kube: fakeCluster } }));
    expect(records.map((record) => `${record.type}:${(record.payload as { metadata: { name: string } }).metadata.name}`)).toEqual(["namespace:shop", "namespace:kube-system"]);
  });
});
