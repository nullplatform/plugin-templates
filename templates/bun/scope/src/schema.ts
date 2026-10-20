import type { ContextFor } from "@nullplatform/plugin/package";
import type { NpJSONSchema } from "@nullplatform/plugin/schema";

export const schema = {
  type: "object",
  required: ["replicas"],
  properties: {
    replicas: { type: "integer", title: "Replicas", default: 1, minimum: 1, order: 1 },
    endpoint: { type: "string", title: "Endpoint", visibleOn: ["read"] },
  },
} as const satisfies NpJSONSchema;

export const uiSchema = {
  type: "VerticalLayout",
  elements: [{ type: "Control", label: "Replicas", scope: "#/properties/replicas" }],
} as const;

export interface Outputs {
  endpoint: string;
}

export type Context = ContextFor<typeof schema>;

export const replicasOf = (ctx: Pick<Context, "params">): number => Math.max(1, Number(ctx.params.replicas ?? 1));
