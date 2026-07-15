/**
 * instance:data — telemetry data-fetch action: report the scope's running
 * instances. The platform validates the return shape directly; return exactly
 * { results: [...] } and write nothing else to stdout.
 *
 * Replace with your infrastructure's real instances (each row: id, selector,
 * state, launch_time, details…).
 */
export async function listInstances(_n: any) {
  return { results: [] };
}
