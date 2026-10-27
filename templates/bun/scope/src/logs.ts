/**
 * log:read — a telemetry action, not a lifecycle one: the platform asks and
 * shows what comes back, checked against the output schema its payload
 * carries. Return exactly { results: [{ message, datetime }] }.
 */

import type { TelemetryInput } from "@nullplatform/plugin/scope";

export interface LogLine {
  message: string;
  datetime: string;
}

export async function readLogs(input: TelemetryInput): Promise<{ results: LogLine[] }> {
  // Replace: read the workload's logs for scope input.scope.id (input.parameters
  // carries the query: deployment_id, start_time, limit, …) from your infrastructure.
  return {
    results: [{ message: `[{{ .Slug }}] scope ${input.scope.id} is alive`, datetime: new Date().toISOString() }],
  };
}
