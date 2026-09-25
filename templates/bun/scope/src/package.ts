import { definePackage, Actions } from "@nullplatform/plugin/package";
import manifest from "../package.json" with { type: "json" };
import { target, targetType } from "./resources";
import { createScope, deleteScope } from "./scope";
import { finalizeBlueGreen, rollbackDeployment, startInitial, switchTraffic } from "./deployment";
import { readLogs } from "./logs";

export default definePackage({
  // Baked in at build time from package.json, so the compiled worker knows
  // who it is wherever it runs.
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  resources: [target, targetType],
  // handle() is exhaustive: one handler per declared action (and per
  // telemetry source), no more, no less.
  handlers: [
    target.handle({
      [Actions.CREATE_SCOPE]: createScope,
      [Actions.DELETE_SCOPE]: deleteScope,
      [Actions.START_INITIAL]: startInitial,
      [Actions.SWITCH_TRAFFIC]: switchTraffic,
      [Actions.FINALIZE_BLUE_GREEN]: finalizeBlueGreen,
      [Actions.ROLLBACK_DEPLOYMENT]: rollbackDeployment,
      [Actions.LOG_READ]: readLogs,
    }),
  ],
});
