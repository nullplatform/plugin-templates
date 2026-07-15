import pkg from "../package.json";
import { defineScope } from "@nullplatform/plugin/scope";
import type { infer as Infer } from "@nullplatform/plugin/schema";
import { createScope } from "./actions/create-scope";
import { deleteScope } from "./actions/delete-scope";
import { startInitial } from "./actions/start-initial";
import { startBlueGreen } from "./actions/start-blue-green";
import { switchTraffic } from "./actions/switch-traffic";
import { finalizeBlueGreen } from "./actions/finalize-blue-green";
import { rollbackDeployment } from "./actions/rollback-deployment";
import { deleteDeployment } from "./actions/delete-deployment";
import { diagnoseScope } from "./actions/diagnose-scope";
import { diagnoseDeployment } from "./actions/diagnose-deployment";
import { sayHello } from "./actions/say-hello";
import { readLogs } from "./actions/log-read";
import { listInstances } from "./actions/instance-data";

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
  // How the platform UI groups this scope type and the infra it targets.
  // Defaults to "custom"; change them here if your scope maps to a known
  // category/provider (e.g. "serverless" / "aws").
  category: "custom",
  provider: "custom",

  // How the platform routes actions to your worker. Optional — defaults to
  // selector { package: "{{ .Slug }}" } and entrypoint
  // /app/packages/{{ .Slug }}/entrypoint. Uncomment to override:
  // agent: {
  //   selector: { package: "{{ .Slug }}" },
  //   entrypoint: "/app/packages/{{ .Slug }}/entrypoint",
  // },

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
    "finalize-blue-green": {
      input: deploymentAction,
      output: { type: "object" },
      handler: finalizeBlueGreen,
    },
    "rollback-deployment": {
      input: deploymentAction,
      output: { type: "object" },
      handler: rollbackDeployment,
    },
    "delete-deployment": {
      input: deploymentAction,
      output: { type: "object" },
      handler: deleteDeployment,
    },
    "diagnose-scope": {
      input: scopeAction,
      output: { type: "object", properties: { healthy: { type: "boolean" } } },
      handler: diagnoseScope,
    },
    "diagnose-deployment": {
      input: deploymentAction,
      output: { type: "object", properties: { healthy: { type: "boolean" } } },
      handler: diagnoseDeployment,
    },

    // A CUSTOM action — any slug you like. The SDK has no defaults for it, so
    // declare name/type here (type "custom" runs as a normal scope action).
    "say-hello": {
      name: "Say Hello",
      type: "custom",
      input: scopeAction,
      output: { type: "object", properties: { message: { type: "string" } } },
      handler: sayHello,
    },

    // Telemetry — ephemeral data-fetch actions ("log:"/"instance:" prefixes).
    // Declaring them adds "telemetry" to the package's channel sources (the SDK
    // derives sources from actions; override via agent.sources if needed).
    "log:read": { input: { type: "object" }, handler: readLogs },
    "instance:data": { input: { type: "object" }, handler: listInstances },
  },
});
