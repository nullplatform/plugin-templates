import pkg from "../package.json";
import { defineScope, Actions } from "@nullplatform/plugin/scope";
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
// Properties users configure when creating a scope. Each appears in the form
// and arrives in ctx.attributes. Keys are YOUR namespace — declare them
// camelCase and read them the same way.

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
// These describe the WIRE payload the platform sends (snake_case by contract).
// Your handlers never read it directly — the SDK maps it into ctx.

export const scopeAction = {
  type: "object",
  properties: {
    parameters: { type: "object", properties: { scope_id: { type: "string" } }, required: ["scope_id"] },
    service: { type: "object", properties: { slug: { type: "string" }, attributes: { type: "object" } } },
    tags: { type: "object" },
  },
  required: ["parameters", "service"],
} as const;

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

// --- Plugin definition ---

defineScope({
  name: "{{ .Slug }}",
  version: pkg.version,
  description: "{{ .Name }} scope plugin",
  // How the platform UI groups this scope type and the infra it targets.
  category: "custom",
  provider: "custom",

  // How the platform routes actions to your worker. Optional — defaults to
  // selector { package: "{{ .Slug }}" }, sources derived from your actions.
  // agent: { selector: { package: "{{ .Slug }}" }, sources: ["service", "telemetry"] },

  schema: scopeSchema,

  uiSchema: {
    type: "VerticalLayout",
    elements: [
      { type: "Control", label: "Enabled", scope: "#/properties/enabled" },
      { type: "Control", label: "Name", scope: "#/properties/name" },
    ],
  },

  actions: {
    // Scope lifecycle — the deploy target's footprint, never workloads.
    [Actions.CREATE_SCOPE]: {
      input: scopeAction,
      output: { type: "object", properties: { message: { type: "string" } } },
      handler: createScope,
    },
    [Actions.DELETE_SCOPE]: {
      input: scopeAction,
      output: { type: "object" },
      handler: deleteScope,
    },

    // Deployment lifecycle — where workloads actually land.
    [Actions.START_INITIAL]: {
      input: deploymentAction,
      output: { type: "object", properties: { deployment_id: { type: "string" } } },
      handler: startInitial,
    },
    [Actions.START_BLUE_GREEN]: {
      input: deploymentAction,
      output: { type: "object", properties: { deployment_id: { type: "string" } } },
      handler: startBlueGreen,
    },
    [Actions.SWITCH_TRAFFIC]: { input: deploymentAction, output: { type: "object" }, handler: switchTraffic },
    [Actions.FINALIZE_BLUE_GREEN]: { input: deploymentAction, output: { type: "object" }, handler: finalizeBlueGreen },
    [Actions.ROLLBACK_DEPLOYMENT]: { input: deploymentAction, output: { type: "object" }, handler: rollbackDeployment },
    [Actions.DELETE_DEPLOYMENT]: { input: deploymentAction, output: { type: "object" }, handler: deleteDeployment },

    // Diagnostics.
    [Actions.DIAGNOSE_SCOPE]: {
      input: scopeAction,
      output: { type: "object", properties: { healthy: { type: "boolean" } } },
      handler: diagnoseScope,
    },
    [Actions.DIAGNOSE_DEPLOYMENT]: {
      input: deploymentAction,
      output: { type: "object", properties: { healthy: { type: "boolean" } } },
      handler: diagnoseDeployment,
    },

    // A CUSTOM action — any slug you like (custom slugs stay plain strings).
    "say-hello": {
      name: "Say Hello",
      type: "custom",
      input: scopeAction,
      output: { type: "object", properties: { message: { type: "string" } } },
      handler: sayHello,
    },

    // Telemetry — same handler shape as everything else. Declaring these adds
    // "telemetry" to the package's channel sources automatically.
    [Actions.LOG_READ]: { input: { type: "object" }, handler: readLogs },
    [Actions.INSTANCE_DATA]: { input: { type: "object" }, handler: listInstances },
  },
});
