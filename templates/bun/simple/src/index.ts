import pkg from "../package.json";
import { createPlugin, registerManifest } from "@nullplatform/plugin";

// The manifest declares identity + channel routing. `agent.sources` is what the
// package's notification channel subscribes to — a custom command handler only
// needs "service"; add "telemetry" only if you implement data-fetch actions.
const manifest = {
  name: "{{ .Slug }}",
  version: pkg.version,
  command_types: ["custom"],
  agent: {
    selector: { package: "{{ .Slug }}" },
    sources: ["service"],
  },
};
registerManifest(manifest);

// `np package publish` runs the binary with --describe to read the manifest.
// Raw createPlugin (unlike defineScope/defineService) has no built-in --describe
// handler, so print the manifest ourselves and exit before starting the server.
if (process.argv.includes("--describe")) {
  process.stdout.write(JSON.stringify(manifest));
  process.exit(0);
}

createPlugin({
  async execute(req) {
    const payload = JSON.parse(req.payload.toString("utf-8"));
    console.log(`[{{ .Slug }}] Received action: ${req.actionType}`, payload);

    // TODO: implement your plugin logic here

    return { success: true, data: { message: "Hello from {{ .Name }}" } };
  },
}).start();
