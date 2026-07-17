import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** The first deployment into the scope — launch the workload here. */
export const startInitial = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.step(`start-initial: deployment ${ctx.deploymentId} on scope ${ctx.scopeId}`);
  // TODO: deploy ctx.assetUrl to your infrastructure
  ctx.log.ok(`deployment ${ctx.deploymentId} running`);
  return { deployment_id: ctx.deploymentId };
};
