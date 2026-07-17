import type { ActionContext } from "@nullplatform/plugin/scope";
import type { ScopeAttributes } from "../index";

/** A custom action — any slug you like, declared with name/type in index.ts. */
export const sayHello = async (ctx: ActionContext<ScopeAttributes>) => {
  ctx.log.ok(`hello from scope ${ctx.scopeId}`);
  return { message: `Hello from {{ .Slug }} (scope ${ctx.scopeId})` };
};
