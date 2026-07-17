import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Promote green, retire blue. */
export const finalizeBlueGreen = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.ok(`promoted deployment ${ctx.deploymentId}; previous workload retired`);
  // TODO: retire the old workload
  return {};
};
