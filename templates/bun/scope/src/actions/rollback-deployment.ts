import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Shift traffic back to the previous deployment. */
export const rollbackDeployment = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.ok(`rolled back to deployment ${ctx.deploymentId}`);
  // TODO: restore the previous workload
  return {};
};
