/**
 * The service's and the link's attributes: the forms the console renders and
 * the typed view of ctx.params. Handlers import their context types from
 * here; the specifications live in resources.ts, so resources → handlers →
 * schema never forms an import cycle.
 */

import type { ContextFor } from "@nullplatform/plugin/package";
import type { NpJSONSchema } from "@nullplatform/plugin/schema";

export const serviceSchema = {
  type: "object",
  required: ["size"],
  properties: {
    // An input: what the user picks when creating or updating the service.
    size: {
      type: "string",
      title: "Size",
      enum: ["small", "medium", "large"],
      default: "small",
      editableOn: ["create", "update"],
      order: 1,
    },
    // An output: written back by `create`, shown on the service and exported
    // to the applications that link it. Never edited by hand. What create and
    // update return must fit these properties — anything else is rejected and
    // the action never completes.
    endpoint: {
      type: "string",
      title: "Endpoint",
      description: "Where the dependency listens (filled in by create)",
      export: true,
      visibleOn: ["read"],
      editableOn: [],
      order: 2,
    },
  },
} as const satisfies NpJSONSchema;

export const serviceUiSchema = {
  type: "VerticalLayout",
  elements: [{ type: "Control", label: "Size", scope: "#/properties/size" }],
} as const;

export const linkSchema = {
  type: "object",
  properties: {
    // Written back by the link's `create` and delivered to the linked
    // application as an environment variable.
    connection_url: {
      type: "string",
      title: "Connection URL",
      export: { type: "environment_variable" },
      visibleOn: ["read"],
      editableOn: [],
      order: 1,
    },
  },
} as const satisfies NpJSONSchema;

export type ServiceContext = ContextFor<typeof serviceSchema>;
export type LinkContext = ContextFor<typeof linkSchema>;
