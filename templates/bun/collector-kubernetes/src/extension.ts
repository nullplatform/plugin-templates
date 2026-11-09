/**
 * What this package adds to nullplatform's Kubernetes collector: its own
 * catalog specifications, its own mappings under the `kubernetes` source
 * type, each written to a specification (its `endpoint`), and the records the
 * library does not collect (a CRD's kind), sent after the library's in every
 * snapshot. All of it the publisher's own: `np package publish` writes it into
 * the organization, beside nullplatform's definitions, which it only pins.
 *
 * Every slug of an extension is named after the package's (package.json
 * `name`), so two packages in one organization never write each other's:
 * `ownSlugOf("namespace-owner")` is `<package slug>-namespace-owner`.
 *
 * An organization binds one mapping of a record type to an endpoint: an
 * extension's mapping written where one of nullplatform's already is (its
 * own `pod` mapping to `k8s-pod`) takes that endpoint over, and nullplatform's
 * mapping is published without it (`extended` drops it). An organization that
 * already bound nullplatform's deletes that destination first
 * (`DELETE /catalog/ingest/destinations/{id}`); its publish would be refused
 * otherwise.
 */

import type { CollectedRecord, SnapshotContext } from "@nullplatform/ingest";
import { SOURCE_TYPE } from "@nullplatform/collector-kubernetes";
import type { CollectorDefinition, EntitySpecification, TypeMapping } from "@nullplatform/plugin/collector";
import manifest from "../package.json" with { type: "json" };
import namespaceOwner from "./mappings/namespace-owner.jsonata" with { type: "text" };

/** What an extension adds: its specifications, its mappings by slug, and the records of its own kinds. */
export interface Extension {
  /** Its catalog specifications, as catalog-entities-api's `POST /specifications` takes them; a relation's target first. */
  entities: EntitySpecification[];
  /** Its mappings under the `kubernetes` type, by slug (never one of nullplatform's), each with the `endpoint` it is written to. */
  mappings: Record<string, TypeMapping>;
  /** The records of the kinds the library does not collect (a CRD's), sent after the library's in every snapshot. */
  snapshot?: (ctx: SnapshotContext) => AsyncIterable<CollectedRecord>;
}

/** No extension: nullplatform's collector as it is. */
export const NO_EXTENSION: Extension = { entities: [], mappings: {} };

/** A slug of the package's own: `<package slug>-<name>`. */
export const ownSlugOf = (name: string): string => `${manifest.name}-${name}`;

/** The record type `mapping` (keyed `slug`) maps. */
const recordTypeOf = (slug: string, mapping: TypeMapping): string => mapping.recordType ?? slug;

/** Where `mapping` is written, when it is: its target and endpoint. */
const destinationOf = (slug: string, mapping: TypeMapping): string | undefined =>
  mapping.endpoint === undefined ? undefined : `${recordTypeOf(slug, mapping)} ${mapping.target ?? "catalog"} ${mapping.endpoint}`;

/** Every record type nullplatform's collector can collect: those its type maps. */
const LIBRARY_TYPES = new Set(Object.entries(SOURCE_TYPE.mappings).map(([slug, mapping]) => recordTypeOf(slug, mapping)));

/**
 * `kubernetes`, the library's definition, with `extension` added: its
 * specifications after nullplatform's, its mappings beside the type's, and
 * its records after the library's in every snapshot. A mapping of the
 * extension written where one of nullplatform's is takes the endpoint over;
 * one of a record type the library can collect but this configuration does
 * not (`K8S_RESOURCES`) is left out, as nullplatform's is, so a run never
 * covers a type it does not send. A mapping keyed by one of nullplatform's
 * slugs is refused.
 */
export function extended(kubernetes: CollectorDefinition, extension: Extension): CollectorDefinition {
  const ours = kubernetes.sourceType?.mappings ?? {};
  const collected = new Set(Object.entries(ours).map(([slug, mapping]) => recordTypeOf(slug, mapping)));
  const taken = Object.keys(extension.mappings).filter((slug) => slug in SOURCE_TYPE.mappings);
  if (taken.length > 0) {
    throw new Error(`the extension's mapping(s) ${taken.join(", ")} are nullplatform's: key each by a slug of the package's own (ownSlugOf)`);
  }
  const added = Object.fromEntries(
    Object.entries(extension.mappings).filter(([slug, mapping]) => !LIBRARY_TYPES.has(recordTypeOf(slug, mapping)) || collected.has(recordTypeOf(slug, mapping))),
  );
  const takenOver = new Set(Object.entries(added).map(([slug, mapping]) => destinationOf(slug, mapping)));
  const platform = Object.fromEntries(
    Object.entries(ours).map(([slug, mapping]) => {
      if (!takenOver.has(destinationOf(slug, mapping))) {
        return [slug, mapping];
      }
      const { endpoint: _endpoint, target: _target, ...unbound } = mapping;
      return [slug, unbound];
    }),
  );
  const snapshotOf = extension.snapshot;
  return {
    ...kubernetes,
    entities: [...(kubernetes.entities ?? []), ...extension.entities],
    sourceType: { ...kubernetes.sourceType!, mappings: { ...platform, ...added } },
    snapshot:
      snapshotOf === undefined
        ? kubernetes.snapshot
        : async function* (ctx) {
            // The library's records (an async iterable, an iterable, or one promised), then the extension's.
            yield* await kubernetes.snapshot(ctx);
            yield* snapshotOf(ctx);
          },
  };
}

/**
 * An extension, ready to switch on (`EXTENSION` in collector.ts): who owns
 * each namespace, from its `team` label, as an entity of the package's own
 * specification, written by its own mapping of the `namespace` records the
 * collector already sends. Nothing to collect beside the library's, so no
 * snapshot of its own; a CRD's kind would add one, and its RBAC in deploy/.
 */
export const namespaceOwners: Extension = {
  entities: [
    {
      slug: ownSlugOf("namespace-owner"),
      name: "Namespace owner",
      description: "The team that owns a Kubernetes namespace, from its team label",
      schema: {
        type: "object",
        properties: {
          external_id: { type: "string", primaryKey: true, autoGenerate: false, description: "The namespace's metadata.uid" },
          key: { type: "string", index: ["filter", "sort", "fulltext"], description: "<cluster>/<namespace>" },
          namespace: { type: "string", index: ["filter", "sort", "fulltext"] },
          cluster: { type: "string", index: ["filter", "facet"], description: "The collector's source slug: the cluster's name" },
          team: { type: "string", index: ["filter", "facet", "fulltext"], description: "The namespace's team label" },
        },
        required: ["external_id", "key", "namespace", "cluster", "team"],
      },
    },
  ],
  mappings: {
    [ownSlugOf("namespace-owner")]: { recordType: "namespace", engine: "jsonata", expression: namespaceOwner, endpoint: ownSlugOf("namespace-owner") },
  },
};
