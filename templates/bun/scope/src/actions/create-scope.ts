import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** A scope is a deploy target: create its footprint here — never workloads. */
export const createScope = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.step(`create-scope ${ctx.scopeId}`);
  // TODO: provision (or verify) whatever your target needs
  ctx.log.ok(`scope ${ctx.scopeId} ready`);
  return { message: `Scope ${ctx.scopeId} created` };
};
