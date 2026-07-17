import type { ActionContext } from "@nullplatform/plugin/scope";

/**
 * log:read — telemetry. Same handler shape as every other action; the SDK
 * keeps stdout pure for you. Return exactly { results: [{ message, datetime }] }.
 */
export const readLogs = async (ctx: ActionContext) => {
  const now = new Date().toISOString();
  return {
    results: [
      { message: `[{{ .Slug }}] scope ${ctx.scopeId} is alive`, datetime: now },
      { message: "[{{ .Slug }}] replace me with real logs (src/actions/log-read.ts)", datetime: now },
    ],
  };
};
