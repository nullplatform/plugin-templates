import pkg from "../package.json";
import { defineScope } from "@nullplatform/plugin/scope";
import type { infer as Infer } from "@nullplatform/plugin/schema";
import { createScope } from "./actions/create-scope";
import { deleteScope } from "./actions/delete-scope";
import { startInitial } from "./actions/start-initial";
import { startBlueGreen } from "./actions/start-blue-green";
import { switchTraffic } from "./actions/switch-traffic";
import { finalizeDeployment } from "./actions/finalize-deployment";
import { rollbackDeployment } from "./actions/rollback-deployment";

// --- Scope schema ---
// Properties that users configure when creating a scope.
// Each property appears in the UI form and arrives in service.attributes.
// Supported keywords: type, default, enum, order, secret, visibleOn, editableOn, export

export const scopeSchema = {
  type: "object",
  properties: {
    enabled: { type: "boolean", default: true, order: 1 },
    name: { type: "string", default: "", order: 2 },
  },
  required: [],
} as const;

export type ScopeAttributes = Infer<typeof scopeSchema>;

// --- Action input schemas ---
// These match the platform notification payload shape.

export const scopeAction = {
  type: "object",
  properties: {
    parameters: { type: "object", properties: { scope_id: { type: "string" } }, required: ["scope_id"] },
    service: { type: "object", properties: { slug: { type: "string" }, attributes: { type: "object" } } },
    tags: { type: "object" },
  },
  required: ["parameters", "service"],
} as const;

export type ScopeActionInput = Infer<typeof scopeAction>;

export const deploymentAction = {
  type: "object",
  properties: {
    parameters: {
      type: "object",
      properties: { scope_id: { type: "string" }, deployment_id: { type: "string" }, weight: { type: "number" } },
      required: ["scope_id", "deployment_id"],
    },
    service: { type: "object", properties: { slug: { type: "string" }, attributes: { type: "object" } } },
    tags: { type: "object" },
  },
  required: ["parameters", "service"],
} as const;

export type DeploymentActionInput = Infer<typeof deploymentAction>;

// --- Plugin definition ---

defineScope({
  name: "{{ .Slug }}",
  version: pkg.version,
  description: "{{ .Name }} scope plugin",
  category: "{{ .Category }}",
  provider: "{{ .Provider }}",

  schema: scopeSchema,

  uiSchema: {
    type: "VerticalLayout",
    elements: [
      { type: "Control", label: "Enabled", scope: "#/properties/enabled" },
      { type: "Control", label: "Name", scope: "#/properties/name" },
    ],
  },

  actions: {
    "create-scope": {
      input: scopeAction,
      output: { type: "object", properties: { message: { type: "string" } } },
      handler: createScope,
    },
    "delete-scope": {
      input: scopeAction,
      output: { type: "object" },
      handler: deleteScope,
    },
    "start-initial": {
      input: deploymentAction,
      output: { type: "object", properties: { deployment_id: { type: "string" } } },
      handler: startInitial,
    },
    "start-blue-green": {
      input: deploymentAction,
      output: { type: "object", properties: { deployment_id: { type: "string" } } },
      handler: startBlueGreen,
    },
    "switch-traffic": {
      input: deploymentAction,
      output: { type: "object" },
      handler: switchTraffic,
    },
    "finalize-deployment": {
      input: scopeAction,
      output: { type: "object" },
      handler: finalizeDeployment,
    },
    "rollback-deployment": {
      input: scopeAction,
      output: { type: "object" },
      handler: rollbackDeployment,
    },
  },
});
