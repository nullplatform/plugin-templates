import type { Context } from "./schema";

export async function readLogs(ctx: Context) {
  return {
    results: [{ message: `Scope ${ctx.scopeId} is alive`, datetime: new Date().toISOString() }],
  };
}
