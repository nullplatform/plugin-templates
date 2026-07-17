import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Tear down one deployment's workload. */
export const deleteDeployment = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.step(`delete-deployment ${ctx.deploymentId}`);
  // TODO: terminate the deployment's workload
  ctx.log.ok("terminated");
  return {};
};
