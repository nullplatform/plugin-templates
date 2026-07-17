import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Shift traffic between blue and green. */
export const switchTraffic = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.ok(`routing ${ctx.weight ?? 100}% of traffic to deployment ${ctx.deploymentId}`);
  // TODO: reweight your load balancer / ingress
  return {};
};
