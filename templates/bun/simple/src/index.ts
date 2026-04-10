import { createPlugin, registerManifest } from "@nullplatform/plugin-sdk";

registerManifest({ name: "{{ .Name }}", version: "0.1.0", command_types: ["custom"] });

createPlugin({
  async execute(req) {
    const payload = JSON.parse(req.payload.toString("utf-8"));
    console.log(`[{{ .Name }}] Received action: ${req.actionType}`, payload);

    // TODO: implement your plugin logic here

    return { success: true, data: { message: "Hello from {{ .Name }}" } };
  },
}).start();
