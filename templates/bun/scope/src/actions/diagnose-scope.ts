import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Report the scope's health. */
export const diagnoseScope = async (ctx: ActionContext<ScopeAttributes>) => {
  // TODO: check your infrastructure's health for this scope
  ctx.log.ok(`scope ${ctx.scopeId} healthy`);
  return { healthy: true, findings: [] };
};
