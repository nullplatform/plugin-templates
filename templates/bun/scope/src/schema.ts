/**
 * The scope's attributes: the form the console renders, the typed view of
 * ctx.params, and what a deployment reports back. Handlers import their
 * context type from here; the scope itself lives in resources.ts, so
 * resources → handlers → schema never forms an import cycle.
 */

import type { ContextFor } from "@nullplatform/plugin/package";
import type { NpJSONSchema } from "@nullplatform/plugin/schema";

export const schema = {
  type: "object",
  // The console's scope form shows exactly the properties listed in
  // `required` (the core API picks them out of `properties`). Give every input
  // a default so "required" costs the user nothing.
  required: ["replicas"],
  properties: {
    // An input: what the user sets when creating the scope; arrives in ctx.params.
    replicas: { type: "integer", title: "Replicas", default: 1, minimum: 1, order: 1 },
    // An output: what a deployment reports back (visibleOn read). Lifecycle
    // results must fit these properties — anything else is rejected and the
    // action never completes.
    endpoint: { type: "string", title: "Endpoint", visibleOn: ["read"] },
  },
} as const satisfies NpJSONSchema;

/** The console's form. A specification without one renders no form at all. */
export const uiSchema = {
  type: "VerticalLayout",
  elements: [{ type: "Control", label: "Replicas", scope: "#/properties/replicas" }],
} as const;

/** What a deployment reports back: only the schema's read-only outputs. */
export interface Outputs {
  endpoint: string;
}

/** What every handler receives, typed from the schema. */
export type Context = ContextFor<typeof schema>;

export const replicasOf = (ctx: Pick<Context, "params">): number => Math.max(1, Number(ctx.params.replicas ?? 1));
