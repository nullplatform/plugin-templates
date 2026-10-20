/**
 * What this package publishes: the {{ .Name }} scope, its scope type, and the
 * handler of every action it answers. Every field is one of the service API's
 * own, in camelCase; the schema is the one the platform renders, verbatim.
 */

import { Actions, scope } from "@nullplatform/plugin/package";
import { schema, uiSchema } from "./schema";
import { createScope, deleteScope } from "./scope";
import {
  deleteDeployment,
  finalizeBlueGreen,
  rollbackDeployment,
  startBlueGreen,
  startInitial,
  switchTraffic,
} from "./deployment";
import { readLogs } from "./logs";

/**
 * The stages the console's deployment timeline shows, one station each. A
 * run's plan must declare its stages: a flat plan leaves the page on the
 * plain entity view.
 */
const STAGE = {
  prepare: { key: "prepare", title: "Prepare" },
  launch: { key: "launch", title: "Launch" },
  traffic: { key: "traffic", title: "Traffic" },
  retire: { key: "retire", title: "Retire" },
};

/** Every step a handler runs, keyed exactly as its ctx.step call, with what it does. */
const STEP = {
  prepareScope: { key: "prepare scope", title: "Prepare the scope", description: "Create what the target needs before any deployment.", group: STAGE.prepare.key },
  removeScope: { key: "remove scope", title: "Remove the scope", description: "Tear down everything the scope owned.", group: STAGE.retire.key },
  resolveAsset: { key: "resolve asset", title: "Resolve the asset", description: "The asset the release ships.", group: STAGE.prepare.key },
  launchWorkload: { key: "launch workload", title: "Launch the workload", description: "Run the asset with the scope's replicas.", group: STAGE.launch.key },
  routeTraffic: { key: "route traffic", title: "Route traffic", description: "Move traffic to the new deployment.", group: STAGE.traffic.key },
  retirePrevious: { key: "retire previous", title: "Retire the previous workload", description: "Remove what was live before.", group: STAGE.retire.key },
  restorePrevious: { key: "restore previous", title: "Restore the previous workload", description: "Put the last good deployment back.", group: STAGE.traffic.key },
  removeWorkload: { key: "remove workload", title: "Remove the workload", description: "Delete what the deployment launched.", group: STAGE.retire.key },
};

const plan = (title: string, description: string, steps: Array<(typeof STEP)[keyof typeof STEP]>) => ({
  title,
  description,
  groups: Object.values(STAGE).filter((g) => steps.some((s) => s.group === g.key)),
  steps,
});

/** Each action's name, intent and expected steps, in stages: the run's plan on the trace. */
export const plans = {
  [Actions.CREATE_SCOPE]: plan("Create the scope", "Prepare the target for deployments.", [STEP.prepareScope]),
  [Actions.DELETE_SCOPE]: plan("Delete the scope", "Remove everything the scope owned.", [STEP.removeScope]),
  [Actions.START_INITIAL]: plan("Deploy the release", "Launch the release's asset as the scope's first workload.", [STEP.resolveAsset, STEP.launchWorkload]),
  [Actions.START_BLUE_GREEN]: plan("Deploy the release", "Launch the new release next to the live one.", [STEP.resolveAsset, STEP.launchWorkload]),
  [Actions.SWITCH_TRAFFIC]: plan("Switch traffic", "Move traffic to the new deployment.", [STEP.routeTraffic]),
  [Actions.FINALIZE_BLUE_GREEN]: plan("Finalize", "Retire the previous workload.", [STEP.retirePrevious]),
  [Actions.ROLLBACK_DEPLOYMENT]: plan("Roll back", "Put the previous workload back.", [STEP.restorePrevious]),
  [Actions.DELETE_DEPLOYMENT]: plan("Retire the deployment", "Delete what the deployment launched.", [STEP.removeWorkload]),
};

export const target = scope({
  slug: "{{ .Slug }}",
  name: "{{ .Name }}",
  // Edit: how the console groups this scope type (category) and what it deploys to (provider).
  selectors: { category: "Scope", provider: "Custom" },
  attributes: { schema },
  uiSchema,
  // What the scope deploys; `np asset push --type <this>` produces it. Default docker-image.
  assetType: "docker-image",
  // Published with the scope: what makes the type creatable in the console.
  scopeType: { description: "Deploy applications to {{ .Name }}" },
  // Telemetry adds data actions: logs → log:read; instances → instance:data.
  telemetry: { logs: true },
  plans,
  actions: {
    [Actions.CREATE_SCOPE]: createScope,
    [Actions.DELETE_SCOPE]: deleteScope,
    [Actions.START_INITIAL]: startInitial,
    [Actions.START_BLUE_GREEN]: startBlueGreen,
    // Its presence is what gives the scope type the console's traffic step.
    [Actions.SWITCH_TRAFFIC]: switchTraffic,
    [Actions.FINALIZE_BLUE_GREEN]: finalizeBlueGreen,
    [Actions.ROLLBACK_DEPLOYMENT]: rollbackDeployment,
    [Actions.DELETE_DEPLOYMENT]: deleteDeployment,
    [Actions.LOG_READ]: readLogs,
  },
});
