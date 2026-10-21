// The entry point: the command line, mapped onto the scope's functions. The
// SDK defines; this file runs. Change it freely — an HTTP server, a Lambda
// handler or a queue consumer would call the same `handle` and `serve`.
//
//   bun src/index.ts --describe              print the manifest (what `np plugin publish` reads)
//   bun src/index.ts --publish --nrn <nrn>   register the scope type on the platform
//   NP_ACTION_CONTEXT=... bun src/index.ts   answer one action (how the agent execs the worker)
//   NP_AGENT_PLUGIN=np-agent-v1 ...          serve the gRPC protocol (how the agent dials the worker)
import { parseArgs } from "node:util";
import { handle, serve } from "@nullplatform/plugin";
import scope from "./scope";

const stop = new AbortController();
process.on("SIGTERM", () => stop.abort());
process.on("SIGINT", () => stop.abort());

try {
  const { values: flags } = parseArgs({
    options: { describe: { type: "boolean" }, publish: { type: "boolean" }, nrn: { type: "string" } },
  });
  if (flags.describe) {
    console.log(JSON.stringify(scope.manifest(), null, 2));
  } else if (flags.publish) {
    if (!flags.nrn) throw new Error('usage: --publish --nrn "organization=123"');
    await scope.publish({ nrn: flags.nrn });
  } else if (process.env.NP_ACTION_CONTEXT && process.env.NP_AGENT_PLUGIN !== "np-agent-v1") {
    const { output, success } = await handle(scope, process.env.NP_ACTION_CONTEXT, { signal: stop.signal });
    process.stdout.write(output);
    process.exit(success ? 0 : 1);
  } else {
    await serve(scope, { signal: stop.signal });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
