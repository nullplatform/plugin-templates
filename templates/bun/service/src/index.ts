import { createPlugin, registerManifest } from "@nullplatform/plugin-sdk";

registerManifest({ name: "{{ .Name }}", version: "0.1.0", command_types: ["service"] });

createPlugin({
  async execute(_req) {
    throw new Error("Service plugins are not implemented yet");
  },
}).start();
