/**
 * log:read — telemetry data-fetch action. The platform validates the return
 * value directly against its output schema, so return exactly
 * { results: [{ message, datetime }] } and write nothing else to stdout.
 *
 * Replace the mock lines with your infrastructure's real logs (e.g. read them
 * from your cloud provider or cluster for the scope in `n.scope`).
 */
export async function readLogs(n: any) {
  const now = new Date().toISOString();
  return {
    results: [
      { message: `[{{ .Slug }}] scope ${n?.scope?.slug ?? ""} is alive`, datetime: now },
      { message: "[{{ .Slug }}] replace me with real logs (src/actions/log-read.ts)", datetime: now },
    ],
  };
}
