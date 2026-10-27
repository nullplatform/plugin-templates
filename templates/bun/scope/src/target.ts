/**
 * The scope itself: a place the platform can deploy to. Creating one
 * provisions nothing for the workload — that happens on the deployment
 * actions in deployment.ts.
 *
 * Each handler takes `(input, context)`: `input` is what the platform sent
 * (`input.scope`, `input.parameters`, `input.service.attributes`), `context`
 * the SDK's tools. Each `context.trace.step(key, (step) => …)` is a step on
 * the action's trace: its key is the plan's in plans.ts, and `step.explain`
 * says what happened and why, in the words the console shows.
 * `context.trace.explain` is the run's own story; `context.log` lines are
 * posted to the action.
 */

import type { ScopeActions } from "@nullplatform/plugin/scope";
import type { Context } from "@nullplatform/plugin";
import { replicasOf, type Results, type ScopeInput } from "./schema";

/** Prepare the target's footprint: what a first deployment will need. */
export async function createScope(input: ScopeInput<typeof ScopeActions.CREATE_SCOPE>, context: Context): Promise<Results> {
  const replicas = replicasOf(input);
  await context.trace.step("prepare-scope", async (step) => {
    // Replace: create what the target needs before any deployment (a
    // namespace, a DNS name, a load balancer…).
    step.explain({
      what: `Scope ${input.scope.id} is ready for ${replicas} replica(s).`,
      why: "Creating a scope prepares the target; the workload arrives with the first deployment.",
    });
  });
  context.log.info(`scope ${input.scope.id} ready for ${replicas} replica(s)`);
  context.trace.explain({ title: "Scope ready", what: `Scope ${input.scope.id} can receive deployments.`, next: "Deploy a release." });
  return {};
}

/** Reclaim everything the scope ever owned. A retry must find nothing left. */
export async function deleteScope(input: ScopeInput<typeof ScopeActions.DELETE_SCOPE>, context: Context): Promise<Results> {
  await context.trace.step("remove-scope", async (step) => {
    // Replace: tear down the footprint create-scope built. Treat "already gone" as success.
    step.explain({ what: `Removed what scope ${input.scope.id} owned.` });
  });
  context.trace.explain({ title: "Scope removed", what: `Scope ${input.scope.id} has nothing left on the target.` });
  return {};
}
