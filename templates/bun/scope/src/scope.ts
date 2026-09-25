/**
 * The scope itself: a place the platform can deploy to. Creating one
 * provisions nothing for the workload — that happens on the deployment
 * actions in deployment.ts. Lifecycle handlers return nothing; the platform
 * tracks their success or failure.
 */

import type { ContextOf } from "@nullplatform/plugin/package";
import type { target } from "./resources";

type Context = ContextOf<typeof target>;

/** Prepare the target's footprint: what a first deployment will need. */
export async function createScope(ctx: Context): Promise<void> {
  const replicas = Number(ctx.params.replicas ?? 1);
  await ctx.step(`prepare scope ${ctx.scopeId}`, async () => {
    // Replace: create what the target needs before any deployment (a
    // namespace, a DNS name, a load balancer…). ctx.state.merge({...})
    // persists what you learn for the other actions to read.
  });
  ctx.log.ok(`scope ${ctx.scopeId} ready for ${replicas} replica(s)`);
}

/** Reclaim everything the scope ever owned. A retry must find nothing left. */
export async function deleteScope(ctx: Context): Promise<void> {
  await ctx.step(`remove scope ${ctx.scopeId}`, async () => {
    // Replace: tear down the footprint create-scope built.
  });
}
