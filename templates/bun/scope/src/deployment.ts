/**
 * Deployments: where the workload actually lands. The platform drives the
 * strategy — initial, blue-green, rollback — and sends one action per move;
 * each handler does its part on your infrastructure. `input.deployment.id`
 * names the deployment, `input.service.attributes` holds the scope's
 * attributes (the asset the release ships among them).
 *
 * What a deployment returns is the attributes it changed: the platform copies
 * into the scope's attributes only those the schema declares (schema.ts).
 */

import { ActionError, type Context } from "@nullplatform/plugin";
import type { ScopeActions } from "@nullplatform/plugin/scope";
import { replicasOf, type DeploymentInput, type Results } from "./schema";

type Launch = typeof ScopeActions.START_INITIAL | typeof ScopeActions.START_BLUE_GREEN;

/** Launch the release's asset, as a fresh workload. */
async function launch(input: DeploymentInput<Launch>, context: Context, alongside: boolean): Promise<Results> {
  const deploymentId = input.deployment.id;
  const asset = await context.trace.step("resolve-asset", async (step) => {
    const url = input.service.attributes.asset_url;
    if (!url) {
      throw new ActionError("NO_ASSET", "the deployment carries no asset url");
    }
    step.explain({ what: `Deployment ${deploymentId} ships ${url}.` });
    step.output("asset", { url });
    return url;
  });
  const replicas = replicasOf(input);
  const endpoint = await context.trace.step("launch-workload", async (step) => {
    // Replace: run `asset` with `replicas` replicas on your infrastructure, as
    // deployment `deploymentId`, and return where it answers.
    const at = `https://${deploymentId}.{{ .Slug }}.example.com`;
    step.explain({
      what: `${replicas} replica(s) of ${asset} answer at ${at}.`,
      why: alongside
        ? "Blue-green: the new workload starts next to the live one; traffic moves in the next steps."
        : "The first deployment into the scope takes all the traffic at once.",
    });
    step.link({ rel: "endpoint", uri: at, label: "Workload" });
    return at;
  });
  context.log.info(`deployment ${deploymentId} running at ${endpoint}`);
  context.trace.explain({ title: "Release deployed", what: `Deployment ${deploymentId} answers at ${endpoint}.` });
  return { endpoint };
}

/** The first deployment into the scope. */
export const startInitial = (input: DeploymentInput<typeof ScopeActions.START_INITIAL>, context: Context): Promise<Results> =>
  launch(input, context, false);

/** A new deployment next to the live one; traffic moves with switch-traffic. */
export const startBlueGreen = (input: DeploymentInput<typeof ScopeActions.START_BLUE_GREEN>, context: Context): Promise<Results> =>
  launch(input, context, true);

/** Move traffic to this deployment, then tell the platform how much moved. */
export async function switchTraffic(input: DeploymentInput<typeof ScopeActions.SWITCH_TRAFFIC>, context: Context): Promise<Results> {
  const deploymentId = input.deployment.id;
  const weight = input.parameters.desired_traffic;
  await context.trace.step("route-traffic", async (step) => {
    // Replace: reweight your load balancer / ingress.
    step.explain({ what: `${weight}% of the traffic goes to deployment ${deploymentId}.` });
  });
  // The platform does not read traffic off the results: reporting it on the deployment is the handler's own obligation.
  await context.api.deployment(deploymentId).patch({ strategy_data: { switched_traffic: weight } });
  return {};
}

/** The new deployment has all the traffic: retire the previous workload. */
export async function finalizeBlueGreen(input: DeploymentInput<typeof ScopeActions.FINALIZE_BLUE_GREEN>, context: Context): Promise<Results> {
  await context.trace.step("retire-previous", async (step) => {
    // Replace: remove the deployment that was live before input.deployment.id.
    step.explain({ what: `Only deployment ${input.deployment.id} is left running.` });
  });
  return {};
}

/** The new deployment failed: put the previous workload back. */
export async function rollbackDeployment(input: DeploymentInput<typeof ScopeActions.ROLLBACK_DEPLOYMENT>, context: Context): Promise<Results> {
  await context.trace.step("restore-previous", async (step) => {
    // Replace: restore the previous workload and route all traffic to it.
    step.explain({ what: `Deployment ${input.deployment.id} was rolled back; the previous workload has the traffic.` });
  });
  return {};
}

/** The platform retires a deployment (before deleting the scope, too). */
export async function deleteDeployment(input: DeploymentInput<typeof ScopeActions.DELETE_DEPLOYMENT>, context: Context): Promise<Results> {
  await context.trace.step("remove-workload", async (step) => {
    // Replace: delete what start-initial / start-blue-green launched. Treat "already gone" as success.
    step.explain({ what: `Deployment ${input.deployment.id} has nothing left running.` });
  });
  return {};
}
