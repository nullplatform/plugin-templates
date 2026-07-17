import type { ActionContext } from "@nullplatform/plugin/scope";

/**
 * instance:data — telemetry: the scope's running instances. Return exactly
 * { results: [...] } (each row: id, selector, state, launch_time, details…).
 */
export const listInstances = async (_ctx: ActionContext) => {
  return { results: [] };
};
