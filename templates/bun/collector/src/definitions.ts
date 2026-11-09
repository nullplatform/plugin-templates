/**
 * What the collector's records need to mean anything in the catalog, all the
 * publisher's own (none is `platform`): the catalog entity specifications
 * they become, the source type the source is of, and that type's mappings,
 * each naming the specification it is written to (its `endpoint`, on the
 * `catalog` target). `np package publish` creates or updates each in the
 * organization it publishes to, and binds every mapping to its endpoint for
 * every source of the type (a destination): nothing is created by hand.
 *
 * Every slug the package defines is named after the package's own slug
 * (package.json's `name`): the source type's is the package's, and each
 * specification's is `<package slug>-<record type>`. Two collectors
 * scaffolded in one organization never write each other's definitions; a
 * package renamed defines new ones, and leaves the old ones where they are.
 * A mapping's slug is its record type: it is unique in its type already.
 */

import { Engine } from "@nullplatform/ingest";
import type { EntitySpecification, SourceTypeDefinition } from "@nullplatform/plugin/collector";
import manifest from "../package.json" with { type: "json" };
import service from "./mappings/service.jsonata" with { type: "text" };
import team from "./mappings/team.jsonata" with { type: "text" };

/** The package's slug, package.json's `name`: what every definition below is named after. */
export const PACKAGE_SLUG = manifest.name;

/** The source type's slug, and so the source's `type`: the package's. */
export const SOURCE_TYPE_SLUG = PACKAGE_SLUG;

/** The catalog specification a record type's entities are written to, by slug: `<package slug>-<record type>`. */
export const specificationOf = (recordType: string): string => `${PACKAGE_SLUG}-${recordType}`;

/** The entities' specifications, as catalog-entities-api's `POST /specifications` takes them; a relation's target before what points at it. */
export const ENTITIES: EntitySpecification[] = [
  {
    slug: specificationOf("team"),
    name: "Team",
    description: "A team that owns services, as the inventory names it",
    schema: {
      type: "object",
      properties: {
        // The entity's identity: what the mapping's `id` is, never generated.
        external_id: { type: "string", primaryKey: true, autoGenerate: false, description: "The team's name in the inventory" },
        // `index` makes a property filterable, sortable or searchable in the catalog.
        name: { type: "string", index: ["filter", "sort", "fulltext"] },
      },
      required: ["external_id", "name"],
    },
  },
  {
    slug: specificationOf("service"),
    name: "Inventory service",
    description: "A service the inventory lists",
    schema: {
      type: "object",
      properties: {
        external_id: { type: "string", primaryKey: true, autoGenerate: false, description: "The service's inventory id" },
        name: { type: "string", index: ["filter", "sort", "fulltext"] },
        owner: { type: "string", index: ["filter", "facet"], description: "The name of the team that owns it" },
      },
      required: ["external_id", "name", "owner"],
      // A service belongs to its team: the mapping writes the team's external_id under the alias. Not strict: a
      // service may arrive before its team.
      relations: {
        team: { type: "belongs_to", target: specificationOf("team"), strict: false, alias: "team_id" },
      },
    },
  },
];

/**
 * The source type, as catalog-ingest-api's `POST /source_types` takes it (its
 * slug the source's `type`), with the mappings every source of it shares, by
 * slug, each its record type's: catalog-ingest-api evaluates each on a record
 * of its type, and writes the `{ id, data }` it returns to its endpoint, which
 * validates `data` against the specification's schema.
 */
export const SOURCE_TYPE: SourceTypeDefinition = {
  name: "Inventory export",
  description: `An inventory export's services and the teams that own them, read by ${PACKAGE_SLUG}`,
  mappings: {
    team: { engine: Engine.JSONATA, expression: team, endpoint: specificationOf("team") },
    service: { engine: Engine.JSONATA, expression: service, endpoint: specificationOf("service") },
  },
};
