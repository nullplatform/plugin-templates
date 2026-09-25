/**
 * Deployments: where the workload actually lands. The platform drives the
 * strategy — initial, blue-green, rollback — and sends one action per move;
 * each handler does its part on your infrastructure. ctx.deploymentId names
 * the deployment, ctx.assetUrl the image, ctx.params the scope's attributes.
 */

import { ActionError, type ContextOf } from "@nullplatform/plugin/package";
import type { target } from "./resources";

type Context = ContextOf<typeof target>;

/** The first deployment into the scope: launch the workload. */
export async function startInitial(ctx: Context): Promise<void> {
  await ctx.step(`deploy ${ctx.assetUrl ?? "the asset"}`, async () => {
    // Replace: run ctx.assetUrl with ctx.params.replicas replicas on your
    // infrastructure, as deployment ctx.deploymentId.
  });
  ctx.log.ok(`deployment ${ctx.deploymentId} running`);
}

/** Move traffic to this deployment, then tell the platform how much moved. */
export async function switchTraffic(ctx: Context): Promise<void> {
  const weight = ctx.weight;
  if (weight === undefined) throw new ActionError("NO_WEIGHT", "switch-traffic carries no traffic weight");
  await ctx.step(`route ${weight}% to ${ctx.deploymentId}`, async () => {
    // Replace: reweight your load balancer / ingress.
  });
  // The platform does not read traffic off the results: reporting it is the
  // handler's own obligation.
  await ctx.deployment.reportTraffic(weight);
}

/** The new deployment has all the traffic: retire the previous workload. */
export async function finalizeBlueGreen(ctx: Context): Promise<void> {
  await ctx.step("retire the previous workload", async () => {
    // Replace: remove the deployment that was live before ctx.deploymentId.
  });
}

/** The new deployment failed: put the previous workload back. */
export async function rollbackDeployment(ctx: Context): Promise<void> {
  await ctx.step(`roll back ${ctx.deploymentId}`, async () => {
    // Replace: restore the previous workload and route traffic to it.
  });
}
