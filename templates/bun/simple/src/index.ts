import pkg from "../package.json";
import { createPlugin, registerManifest } from "@nullplatform/plugin";

registerManifest({ name: "{{ .Slug }}", version: pkg.version, command_types: ["custom"] });

createPlugin({
  async execute(req) {
    const payload = JSON.parse(req.payload.toString("utf-8"));
    console.log(`[{{ .Slug }}] Received action: ${req.actionType}`, payload);

    // TODO: implement your plugin logic here

    return { success: true, data: { message: "Hello from {{ .Name }}" } };
  },
}).start();
