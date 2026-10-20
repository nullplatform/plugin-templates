import { ActionError } from "@nullplatform/plugin/package";
import { replicasOf, type Context, type Outputs } from "./schema";

async function launch(ctx: Context): Promise<Outputs> {
  const asset = await ctx.step("resolve asset", async () => {
    if (!ctx.assetUrl) throw new ActionError("NO_ASSET", "The deployment has no asset");
    return ctx.assetUrl;
  });

  const endpoint = await ctx.step("launch workload", async (step) => {
    const url = `https://${ctx.deploymentId}.{{ .Slug }}.example.com`;
    step.explain({ what: `${replicasOf(ctx)} replica(s) of ${asset} answer at ${url}.` });
    return url;
  });

  return { endpoint };
}

export const startInitial = launch;
export const startBlueGreen = launch;

export async function switchTraffic(ctx: Context): Promise<void> {
  const weight = ctx.weight;
  if (weight === undefined) throw new ActionError("NO_WEIGHT", "The action has no traffic weight");

  await ctx.step("route traffic", async (step) => {
    step.explain({ what: `${weight}% of traffic goes to deployment ${ctx.deploymentId}.` });
  });
  await ctx.deployment.reportTraffic(weight);
}

export async function finalizeBlueGreen(ctx: Context): Promise<void> {
  await ctx.step("retire previous", async () => {});
}

export async function rollbackDeployment(ctx: Context): Promise<void> {
  await ctx.step("restore previous", async () => {});
}

export async function deleteDeployment(ctx: Context): Promise<void> {
  await ctx.step("remove workload", async () => {});
}
