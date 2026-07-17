import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Launch the new (green) workload alongside the current one. */
export const startBlueGreen = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.step(`start-blue-green: deployment ${ctx.deploymentId} on scope ${ctx.scopeId}`);
  // TODO: deploy the green workload
  ctx.log.ok(`deployment ${ctx.deploymentId} running`);
  return { deployment_id: ctx.deploymentId };
};
