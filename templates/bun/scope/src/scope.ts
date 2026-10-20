/**
 * The scope itself: a place the platform can deploy to. Creating one
 * provisions nothing for the workload — that happens on the deployment
 * actions in deployment.ts.
 *
 * Each `ctx.step(name, (step) => …)` is a step on the action's trace: its
 * name must match the plan in resources.ts, and `step.explain` says what
 * happened and why, in the words the console shows. `ctx.trace` is the run's
 * own story.
 */

import { replicasOf, type Context } from "./schema";

/** Prepare the target's footprint: what a first deployment will need. */
export async function createScope(ctx: Context): Promise<void> {
  const replicas = replicasOf(ctx);
  await ctx.step("prepare scope", async (step) => {
    // Replace: create what the target needs before any deployment (a
    // namespace, a DNS name, a load balancer…).
    step.explain({
      what: `Scope ${ctx.scopeId} is ready for ${replicas} replica(s).`,
      why: "Creating a scope prepares the target; the workload arrives with the first deployment.",
    });
  });
  ctx.log.ok(`scope ${ctx.scopeId} ready for ${replicas} replica(s)`);
  ctx.trace.explain({ title: "Scope ready", what: `Scope ${ctx.scopeId} can receive deployments.`, next: "Deploy a release." });
}

/** Reclaim everything the scope ever owned. A retry must find nothing left. */
export async function deleteScope(ctx: Context): Promise<void> {
  await ctx.step("remove scope", async (step) => {
    // Replace: tear down the footprint create-scope built. Treat "already gone" as success.
    step.explain({ what: `Removed what scope ${ctx.scopeId} owned.` });
  });
  ctx.trace.explain({ title: "Scope removed", what: `Scope ${ctx.scopeId} has nothing left on the target.` });
}
