/**
 * Deployments: where the workload actually lands. The platform drives the
 * strategy — initial, blue-green, rollback — and sends one action per move;
 * each handler does its part on your infrastructure. ctx.deploymentId names
 * the deployment, ctx.assetUrl the asset, ctx.params the scope's attributes.
 *
 * What a deployment returns must fit the schema's read-only outputs
 * (schema.ts): a result outside them is rejected and the action hangs.
 */

import { ActionError } from "@nullplatform/plugin/package";
import { replicasOf, type Context, type Outputs } from "./schema";

/** Launch the release's asset, as a fresh workload. */
async function launch(ctx: Context, alongside: boolean): Promise<Outputs> {
  const asset = await ctx.step("resolve asset", async (step) => {
    const url = ctx.assetUrl;
    if (!url) throw new ActionError("NO_ASSET", "the deployment carries no asset url");
    step.explain({ what: `Deployment ${ctx.deploymentId} ships ${url}.` });
    step.output("asset", { url });
    return url;
  });
  const replicas = replicasOf(ctx);
  const endpoint = await ctx.step("launch workload", async (step) => {
    // Replace: run `asset` with `replicas` replicas on your infrastructure, as
    // deployment ctx.deploymentId, and return where it answers.
    const at = `https://${ctx.deploymentId}.{{ .Slug }}.example.com`;
    step.explain({
      what: `${replicas} replica(s) of ${asset} answer at ${at}.`,
      why: alongside
        ? "Blue-green: the new workload starts next to the live one; traffic moves in the next steps."
        : "The first deployment into the scope takes all the traffic at once.",
    });
    step.link({ rel: "endpoint", uri: at, label: "Workload" });
    return at;
  });
  ctx.log.ok(`deployment ${ctx.deploymentId} running at ${endpoint}`);
  ctx.trace.explain({ title: "Release deployed", what: `Deployment ${ctx.deploymentId} answers at ${endpoint}.` });
  return { endpoint };
}

/** The first deployment into the scope. */
export const startInitial = (ctx: Context): Promise<Outputs> => launch(ctx, false);

/** A new deployment next to the live one; traffic moves with switch-traffic. */
export const startBlueGreen = (ctx: Context): Promise<Outputs> => launch(ctx, true);

/** Move traffic to this deployment, then tell the platform how much moved. */
export async function switchTraffic(ctx: Context): Promise<void> {
  const weight = ctx.weight;
  if (weight === undefined) throw new ActionError("NO_WEIGHT", "switch-traffic carries no traffic weight (desired_traffic)");
  await ctx.step("route traffic", async (step) => {
    // Replace: reweight your load balancer / ingress.
    step.explain({ what: `${weight}% of the traffic goes to deployment ${ctx.deploymentId}.` });
  });
  // The platform does not read traffic off the results: reporting it is the handler's own obligation.
  await ctx.deployment.reportTraffic(weight);
}

/** The new deployment has all the traffic: retire the previous workload. */
export async function finalizeBlueGreen(ctx: Context): Promise<void> {
  await ctx.step("retire previous", async (step) => {
    // Replace: remove the deployment that was live before ctx.deploymentId.
    step.explain({ what: `Only deployment ${ctx.deploymentId} is left running.` });
  });
}

/** The new deployment failed: put the previous workload back. */
export async function rollbackDeployment(ctx: Context): Promise<void> {
  await ctx.step("restore previous", async (step) => {
    // Replace: restore the previous workload and route all traffic to it.
    step.explain({ what: `Deployment ${ctx.deploymentId} was rolled back; the previous workload has the traffic.` });
  });
}

/** The platform retires a deployment (before deleting the scope, too). */
export async function deleteDeployment(ctx: Context): Promise<void> {
  await ctx.step("remove workload", async (step) => {
    // Replace: delete what start-initial / start-blue-green launched. Treat "already gone" as success.
    step.explain({ what: `Deployment ${ctx.deploymentId} has nothing left running.` });
  });
}
