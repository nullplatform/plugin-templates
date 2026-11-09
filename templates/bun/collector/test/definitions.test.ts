import { describe, expect, test } from "bun:test";
import type { CollectedRecord } from "@nullplatform/ingest";
import { InMemoryIngest } from "@nullplatform/ingest/testing";
import { run } from "@nullplatform/plugin/testing";
import Ajv from "ajv";
import jsonata from "jsonata";
import { inventoryCollector } from "../src/collector";
import { ENTITIES, PACKAGE_SLUG, SOURCE_TYPE, SOURCE_TYPE_SLUG } from "../src/definitions";

// The definitions hold together on what the collector really sends: every
// record a snapshot of the fixture export sends, through its type's mapping as
// catalog-ingest-api evaluates it, makes an entity its specification accepts.
// Change a mapping or a specification and this says whether the other still
// agrees, before a publish or a run finds out.

/** The source and the run a mapping reads (`$source`, `$run`), as catalog-ingest-api binds them. */
const BINDINGS = { source: { slug: PACKAGE_SLUG, type: SOURCE_TYPE_SLUG, attributes: {} }, run: { mode: "full" } };

/** What catalog-ingest-api's slugs take (a source type's, a record type's), and catalog-entities-api's specification slugs. */
const INGEST_SLUG = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const SPECIFICATION_SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

type Schema = { properties: Record<string, unknown>; relations?: Record<string, { target: string; alias: string }> };

const mappings = SOURCE_TYPE.mappings!;
const specificationNamed = (slug: string) => ENTITIES.find((specification) => specification.slug === slug)!;

/** Every record a snapshot of the fixture export sends. */
async function snapshotted(): Promise<CollectedRecord[]> {
  const ingest = new InMemoryIngest();
  await run(inventoryCollector({ inventoryUrl: new URL("./fixtures/inventory.json", import.meta.url).href }), {}, { ports: { ingest } });
  return ingest.runs[0].records;
}

/** What `record`'s type's mapping makes of it, as JSON: the entity's id and data. */
async function mappedOf(record: CollectedRecord): Promise<{ id: unknown; data: Record<string, unknown> }> {
  const output = await jsonata(mappings[record.type].expression).evaluate(record.payload, BINDINGS);
  return JSON.parse(JSON.stringify(output));
}

/** The catalog's keywords beside JSON Schema's (`primaryKey`, `index`, `relations`…) are its own: not strict. */
const validator = () => new Ajv({ strict: false, allErrors: true });

describe("the definitions", () => {
  test("every slug is named after the package, and is one the APIs take", () => {
    expect(SOURCE_TYPE_SLUG).toBe(PACKAGE_SLUG);
    expect(SOURCE_TYPE_SLUG).toMatch(INGEST_SLUG);
    for (const [slug, mapping] of Object.entries(mappings)) {
      expect(slug).toMatch(INGEST_SLUG);
      expect(mapping.recordType ?? slug).toMatch(INGEST_SLUG);
    }
    for (const specification of ENTITIES) {
      expect(specification.slug).toMatch(SPECIFICATION_SLUG);
      expect(specification.slug.startsWith(`${PACKAGE_SLUG}-`)).toBe(true);
    }
  });

  test("every mapping writes to a specification of the package, and every relation points at one described before it", () => {
    const slugs = ENTITIES.map((specification) => specification.slug);
    expect(Object.values(mappings).map((mapping) => slugs.includes(mapping.endpoint!))).toEqual(Object.values(mappings).map(() => true));
    ENTITIES.forEach((specification, index) => {
      for (const relation of Object.values((specification.schema as Schema).relations ?? {})) {
        expect(slugs.slice(0, index)).toContain(relation.target);
      }
    });
  });

  test("every record a snapshot sends maps to an entity its specification accepts", async () => {
    const ajv = validator();
    const records = await snapshotted();
    expect([...new Set(records.map((record) => record.type))].sort()).toEqual(Object.keys(mappings).sort());
    for (const record of records) {
      const specification = specificationNamed(mappings[record.type].endpoint!);
      const schema = specification.schema as Schema;
      const { id, data } = await mappedOf(record);
      const name = `${record.type} ${JSON.stringify(record.payload)}`;
      const valid = ajv.validate(specification.schema, data);
      expect({ name, errors: valid ? [] : ajv.errors }).toEqual({ name, errors: [] });
      // The entity's id is its primary key: one entity per record, whatever order the records arrive in.
      expect({ name, id }).toEqual({ name, id: data.external_id });
      const aliases = Object.values(schema.relations ?? {}).map((relation) => relation.alias);
      const undeclared = Object.keys(data).filter((field) => schema.properties[field] === undefined && !aliases.includes(field));
      expect({ name, undeclared }).toEqual({ name, undeclared: [] });
      const unwritten = aliases.filter((alias) => !(alias in data));
      expect({ name, unwritten }).toEqual({ name, unwritten: [] });
    }
  });

  test("a service is written with its team, by the team's id", async () => {
    const [billing] = (await snapshotted()).filter((record) => record.type === "service");
    expect(await mappedOf(billing)).toEqual({ id: "svc-10", data: { external_id: "svc-10", name: "billing", owner: "payments", team_id: "payments" } });
  });

  test("an entity a specification refuses is caught: the check is not vacuous", async () => {
    const ajv = validator();
    const [service] = (await snapshotted()).filter((record) => record.type === "service");
    const { data } = await mappedOf(service);
    const specification = specificationNamed(mappings.service.endpoint!);
    expect(ajv.validate(specification.schema, data)).toBe(true);
    expect(ajv.validate(specification.schema, { ...data, owner: undefined })).toBe(false);
    expect(ajv.validate(specification.schema, { ...data, name: 42 })).toBe(false);
  });
});
