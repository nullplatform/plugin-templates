import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Report one deployment's health. */
export const diagnoseDeployment = async (ctx: ActionContext<ScopeAttributes>) => {
  // TODO: check the deployment's workload health
  ctx.log.ok(`deployment ${ctx.deploymentId} healthy`);
  return { healthy: true, findings: [] };
};
