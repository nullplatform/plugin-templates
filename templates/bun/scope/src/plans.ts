/**
 * How each action reads on the console's timeline: its title, what it does,
 * and its plan — the steps it runs, in stages. A step's key is the exact name
 * its handler gives `context.trace.step`; a stage is one station of the
 * deployment timeline, and a plan with no stages leaves the page on the plain
 * entity view. None of it is published: it is the run's, on the trace.
 */

import type { Plan } from "@nullplatform/plugin";
import { ScopeActions } from "@nullplatform/plugin/scope";

/** The stages the console's deployment timeline shows, one station each. */
const STAGE = {
  prepare: { key: "prepare", title: "Prepare" },
  launch: { key: "launch", title: "Launch" },
  traffic: { key: "traffic", title: "Traffic" },
  retire: { key: "retire", title: "Retire" },
};

/** Every step a handler runs, keyed exactly as its context.trace.step call, with what it does. */
const STEP = {
  prepareScope: { key: "prepare-scope", title: "Prepare the scope", description: "Create what the target needs before any deployment.", group: STAGE.prepare.key },
  removeScope: { key: "remove-scope", title: "Remove the scope", description: "Tear down everything the scope owned.", group: STAGE.retire.key },
  resolveAsset: { key: "resolve-asset", title: "Resolve the asset", description: "The asset the release ships.", group: STAGE.prepare.key },
  launchWorkload: { key: "launch-workload", title: "Launch the workload", description: "Run the asset with the scope's replicas.", group: STAGE.launch.key },
  routeTraffic: { key: "route-traffic", title: "Route traffic", description: "Move traffic to the new deployment.", group: STAGE.traffic.key },
  retirePrevious: { key: "retire-previous", title: "Retire the previous workload", description: "Remove what was live before.", group: STAGE.retire.key },
  restorePrevious: { key: "restore-previous", title: "Restore the previous workload", description: "Put the last good deployment back.", group: STAGE.traffic.key },
  removeWorkload: { key: "remove-workload", title: "Remove the workload", description: "Delete what the deployment launched.", group: STAGE.retire.key },
};

type PlannedStep = (typeof STEP)[keyof typeof STEP];

/** An action's narration on the trace: its title, its description and its plan. */
interface Narration {
  title: string;
  description: string;
  plan: Plan & { steps: PlannedStep[] };
}

/** The narration of an action that runs `steps`, with the stages they sit in. */
const narrated = (title: string, description: string, steps: PlannedStep[]): Narration => ({
  title,
  description,
  plan: { groups: Object.values(STAGE).filter((stage) => steps.some((step) => step.group === stage.key)), steps },
});

/** Each lifecycle action's title, intent and expected steps, in stages. */
export const narration = {
  [ScopeActions.CREATE_SCOPE]: narrated("Create the scope", "Prepare the target for deployments.", [STEP.prepareScope]),
  [ScopeActions.DELETE_SCOPE]: narrated("Delete the scope", "Remove everything the scope owned.", [STEP.removeScope]),
  [ScopeActions.START_INITIAL]: narrated("Deploy the release", "Launch the release's asset as the scope's first workload.", [STEP.resolveAsset, STEP.launchWorkload]),
  [ScopeActions.START_BLUE_GREEN]: narrated("Deploy the release", "Launch the new release next to the live one.", [STEP.resolveAsset, STEP.launchWorkload]),
  [ScopeActions.SWITCH_TRAFFIC]: narrated("Switch traffic", "Move traffic to the new deployment.", [STEP.routeTraffic]),
  [ScopeActions.FINALIZE_BLUE_GREEN]: narrated("Finalize", "Retire the previous workload.", [STEP.retirePrevious]),
  [ScopeActions.ROLLBACK_DEPLOYMENT]: narrated("Roll back", "Put the previous workload back.", [STEP.restorePrevious]),
  [ScopeActions.DELETE_DEPLOYMENT]: narrated("Retire the deployment", "Delete what the deployment launched.", [STEP.removeWorkload]),
};
