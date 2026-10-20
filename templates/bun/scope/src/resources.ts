import { Actions, scope } from "@nullplatform/plugin/package";
import {
  deleteDeployment,
  finalizeBlueGreen,
  rollbackDeployment,
  startBlueGreen,
  startInitial,
  switchTraffic,
} from "./deployment";
import { readLogs } from "./logs";
import { schema, uiSchema } from "./schema";
import { createScope, deleteScope } from "./scope";

export const target = scope({
  slug: "{{ .Slug }}",
  name: "{{ .Name }}",
  selectors: { category: "Scope", provider: "Custom" },
  attributes: { schema },
  uiSchema,
  assetType: "docker-image",
  scopeType: { description: "Deploy applications to {{ .Name }}" },
  telemetry: { logs: true },
  plans: {
    [Actions.CREATE_SCOPE]: ["prepare scope"],
    [Actions.DELETE_SCOPE]: ["remove scope"],
    [Actions.START_INITIAL]: ["resolve asset", "launch workload"],
    [Actions.START_BLUE_GREEN]: ["resolve asset", "launch workload"],
    [Actions.SWITCH_TRAFFIC]: ["route traffic"],
    [Actions.FINALIZE_BLUE_GREEN]: ["retire previous"],
    [Actions.ROLLBACK_DEPLOYMENT]: ["restore previous"],
    [Actions.DELETE_DEPLOYMENT]: ["remove workload"],
  },
  actions: {
    [Actions.CREATE_SCOPE]: createScope,
    [Actions.DELETE_SCOPE]: deleteScope,
    [Actions.START_INITIAL]: startInitial,
    [Actions.START_BLUE_GREEN]: startBlueGreen,
    [Actions.SWITCH_TRAFFIC]: switchTraffic,
    [Actions.FINALIZE_BLUE_GREEN]: finalizeBlueGreen,
    [Actions.ROLLBACK_DEPLOYMENT]: rollbackDeployment,
    [Actions.DELETE_DEPLOYMENT]: deleteDeployment,
    [Actions.LOG_READ]: readLogs,
  },
});
