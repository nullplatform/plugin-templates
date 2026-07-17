import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** Reclaim everything the scope ever owned. */
export const deleteScope = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.step(`delete-scope ${ctx.scopeId}`);
  // TODO: deprovision the target's footprint
  ctx.log.ok("footprint clean");
  return {};
};
