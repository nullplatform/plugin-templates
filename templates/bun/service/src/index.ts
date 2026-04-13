import { createPlugin, registerManifest } from "@nullplatform/plugin";

registerManifest({ name: "{{ .Slug }}", version: "0.1.0", command_types: ["service"] });

createPlugin({
  async execute(req) {
    const payload = JSON.parse(req.payload.toString("utf-8"));
    console.log(`[{{ .Slug }}] Received action: ${req.actionType}`, payload);

    // TODO: implement your service plugin logic here

    return { success: true, data: { message: "Hello from {{ .Name }}" } };
  },
}).start();
