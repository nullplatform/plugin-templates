import pkg from "../package.json";
import { createPlugin, registerManifest } from "@nullplatform/plugin";

// The entry point: the agent dials this worker over gRPC; serve until stopped.
const stop = new AbortController();
process.on("SIGTERM", () => stop.abort());
process.on("SIGINT", () => stop.abort());

registerManifest({ name: "{{ .Slug }}", version: pkg.version, command_types: ["custom"] });

try {
  await createPlugin({
    async execute(req) {
      const payload = JSON.parse(req.payload.toString("utf-8"));
      console.log(`[{{ .Slug }}] Received action: ${req.actionType}`, payload);

      // TODO: implement your plugin logic here

      return { success: true, data: { message: "Hello from {{ .Name }}" } };
    },
  }).serve({ signal: stop.signal });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
