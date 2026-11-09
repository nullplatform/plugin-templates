import { describe, expect, test } from "bun:test";
import type { CollectedRecord } from "@nullplatform/ingest";
import { collectorDefinition, SOURCE_TYPE } from "@nullplatform/collector-kubernetes";
import Ajv from "ajv";
import jsonata from "jsonata";
import { EXTENSION, kubernetesCollector } from "../src/collector";
import { extended, namespaceOwners, NO_EXTENSION, ownSlugOf, type Extension } from "../src/extension";
import { fakeCluster, snapshotOf, SOURCE } from "./cluster";

// An extension adds the package's own definitions beside nullplatform's: its
// specifications and its mappings are the publisher's (no owner), each bound
// where it is written. `namespaceOwners` is inert until EXTENSION names it;
// here it is applied explicitly, its mapping evaluated as catalog-ingest-api
// would on what a snapshot sends, and its output validated against its
// specification.

/** A deployment that reads only namespaces, from the fake cluster. */
const NAMESPACES = { resources: ["namespace"], events: { enabled: false } };

const destinationsOf = (extension: Extension) =>
  kubernetesCollector({}, { extension })
    .manifest()
    .components.filter((component) => component.resource_type === "destination")
    .map((component) => component.name);

/** What `mapping`'s expression makes of `record`, as catalog-ingest-api evaluates it for the test's source. */
async function mappedOf(expression: string, record: CollectedRecord) {
  return JSON.parse(JSON.stringify((await jsonata(expression).evaluate(record.payload, { source: { slug: SOURCE.slug, type: "kubernetes", attributes: {} } })) ?? null));
}

describe("the extension", () => {
  test("is none until EXTENSION names one: the definitions are nullplatform's as they are", () => {
    expect(EXTENSION).toBe(NO_EXTENSION);
    const kubernetes = collectorDefinition();
    expect(extended(kubernetes, NO_EXTENSION).sourceType).toEqual(kubernetes.sourceType);
    expect(extended(kubernetes, NO_EXTENSION).entities).toEqual(kubernetes.entities);
  });

  test("namespaceOwners publishes its own specification and mapping beside nullplatform's, bound where it is written", () => {
    const components = kubernetesCollector({}, { extension: namespaceOwners }).manifest().components;
    const own = components.filter((component) => component.owner === undefined && component.resource_type !== "destination");
    expect(own.map((component) => [component.resource_type, component.name])).toEqual([
      ["entity_specification", ownSlugOf("namespace-owner")],
      ["mapping", `kubernetes/${ownSlugOf("namespace-owner")}`],
    ]);
    expect(destinationsOf(namespaceOwners)).toContain(`kubernetes/${ownSlugOf("namespace-owner")}/${ownSlugOf("namespace-owner")}`);
    expect(destinationsOf(namespaceOwners)).toHaveLength(15);
  });

  test("its mapping makes, of each labelled namespace a snapshot sends, an entity its specification accepts; an unlabelled one is skipped", async () => {
    const records = await snapshotOf(kubernetesCollector(NAMESPACES, { deps: { kube: fakeCluster }, extension: namespaceOwners }));
    const [specification] = namespaceOwners.entities;
    const { expression } = namespaceOwners.mappings[ownSlugOf("namespace-owner")];
    const [shop, kubeSystem] = records;
    const entity = await mappedOf(expression, shop);
    expect(entity).toEqual({
      id: "e20e09f4-499a-4abf-96a1-600edcde1779",
      data: { external_id: "e20e09f4-499a-4abf-96a1-600edcde1779", key: "test-cluster/shop", namespace: "shop", cluster: "test-cluster", team: "commerce" },
    });
    const ajv = new Ajv({ strict: false, allErrors: true });
    expect(ajv.validate(specification.schema, entity.data) ? [] : ajv.errors).toEqual([]);
    expect(ajv.validate(specification.schema, { ...entity.data, team: undefined })).toBe(false);
    expect(await mappedOf(expression, kubeSystem)).toBeNull();
  });

  test("a mapping written where nullplatform's is takes its endpoint over: the organization binds one per record type and endpoint", () => {
    const podsOfTeams: Extension = {
      entities: [],
      mappings: { [ownSlugOf("pod")]: { recordType: "pod", engine: "jsonata", expression: '{ "id": metadata.uid, "data": {} }', endpoint: "k8s-pod" } },
    };
    const destinations = destinationsOf(podsOfTeams);
    expect(destinations).toContain(`kubernetes/${ownSlugOf("pod")}/k8s-pod`);
    expect(destinations).not.toContain("kubernetes/pod/k8s-pod");
    expect(destinations).toHaveLength(14);
    // nullplatform's mapping is still pinned, as it is, without where it was written.
    const pod = kubernetesCollector({}, { extension: podsOfTeams }).manifest().components.find((component) => component.name === "kubernetes/pod");
    expect(pod?.owner).toBe("platform");
  });

  test("a mapping of a kind the deployment does not collect is left out, so no run covers what it never sends", () => {
    const pods = kubernetesCollector({ resources: ["pod"], events: { enabled: false } }, { extension: namespaceOwners });
    expect(pods.manifest().collector).toMatchObject({ recordTypes: ["pod"] });
  });

  test("a mapping keyed by one of nullplatform's slugs is refused", () => {
    const clash: Extension = { entities: [], mappings: { pod: { ...SOURCE_TYPE.mappings.pod, platform: undefined } } };
    expect(() => kubernetesCollector({}, { extension: clash })).toThrow("the extension's mapping(s) pod are nullplatform's");
  });

  test("the records of its own kinds (a CRD's) are sent after the library's in every snapshot", async () => {
    const widgets: Extension = {
      entities: [],
      mappings: { [ownSlugOf("widget")]: { recordType: "widget", engine: "jsonata", expression: '{ "id": name, "data": { "external_id": name } }', endpoint: ownSlugOf("widget") } },
      async *snapshot() {
        yield { type: "widget", payload: { name: "w-1" } };
      },
    };
    const records = await snapshotOf(kubernetesCollector(NAMESPACES, { deps: { kube: fakeCluster }, extension: widgets }));
    expect(records.map((record) => record.type)).toEqual(["namespace", "namespace", "widget"]);
  });
});
