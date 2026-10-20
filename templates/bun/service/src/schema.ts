import type { ContextFor } from "@nullplatform/plugin/package";
import type { NpJSONSchema } from "@nullplatform/plugin/schema";

export const serviceSchema = {
  type: "object",
  required: ["size"],
  properties: {
    size: {
      type: "string",
      title: "Size",
      enum: ["small", "medium", "large"],
      default: "small",
      editableOn: ["create", "update"],
      order: 1,
    },
    endpoint: {
      type: "string",
      title: "Endpoint",
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
