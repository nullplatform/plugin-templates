/**
 * What this package publishes: the {{ .Name }} scope, its scope type, and the
 * handler of every action it answers. A well-known action (ScopeActions) is
 * answered with its lifecycle on the platform; log:read is a telemetry
 * action, answered raw. Nothing runs on import: src/index.ts runs it.
 */

import { defineScope, ScopeActions } from "@nullplatform/plugin/scope";
import manifest from "../package.json" with { type: "json" };
import { deleteDeployment, finalizeBlueGreen, rollbackDeployment, startBlueGreen, startInitial, switchTraffic } from "./deployment";
import { readLogs } from "./logs";
import { narration } from "./plans";
import { specification } from "./schema";
import { createScope, deleteScope } from "./target";

export default defineScope({
  // The package, as package.json declares it: baked in at build time, so the compiled worker knows who it is wherever it runs.
  package: { name: manifest.name, version: manifest.version, description: manifest.description },
  specification,
  // What the scope deploys; `np asset push --type <this>` produces it.
  assetType: "docker-image",
  // Published with the scope: what makes the type creatable in the console.
  scopeType: { name: "{{ .Name }}", description: "Deploy applications to {{ .Name }}" },
  actions: {
    [ScopeActions.CREATE_SCOPE]: { ...narration[ScopeActions.CREATE_SCOPE], handler: createScope },
    [ScopeActions.DELETE_SCOPE]: { ...narration[ScopeActions.DELETE_SCOPE], handler: deleteScope },
    [ScopeActions.START_INITIAL]: { ...narration[ScopeActions.START_INITIAL], handler: startInitial },
    [ScopeActions.START_BLUE_GREEN]: { ...narration[ScopeActions.START_BLUE_GREEN], handler: startBlueGreen },
    // Its presence is what gives the scope type the console's traffic step.
    [ScopeActions.SWITCH_TRAFFIC]: { ...narration[ScopeActions.SWITCH_TRAFFIC], handler: switchTraffic },
    [ScopeActions.FINALIZE_BLUE_GREEN]: { ...narration[ScopeActions.FINALIZE_BLUE_GREEN], handler: finalizeBlueGreen },
    [ScopeActions.ROLLBACK_DEPLOYMENT]: { ...narration[ScopeActions.ROLLBACK_DEPLOYMENT], handler: rollbackDeployment },
    [ScopeActions.DELETE_DEPLOYMENT]: { ...narration[ScopeActions.DELETE_DEPLOYMENT], handler: deleteDeployment },
    // A telemetry action: the platform asks for the workload's logs and shows what comes back.
    [ScopeActions.LOG_READ]: readLogs,
  },
});
