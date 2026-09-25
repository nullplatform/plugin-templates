/**
 * log:read — a data action, not a lifecycle one: the platform asks and shows
 * what comes back. Return exactly { results: [{ message, datetime }] }.
 */

import type { ContextOf } from "@nullplatform/plugin/package";
import type { target } from "./resources";

export interface LogLine {
  message: string;
  datetime: string;
}

export async function readLogs(ctx: ContextOf<typeof target>): Promise<{ results: LogLine[] }> {
  // Replace: read the workload's logs for scope ctx.scopeId (ctx.params carries
  // the query: deployment_id, start_time, limit, …) from your infrastructure.
  return {
    results: [{ message: `[{{ .Slug }}] scope ${ctx.scopeId} is alive`, datetime: new Date().toISOString() }],
  };
}
