import { describe, expect, test } from "@nullplatform/plugin/testing";
import { startPluginProcess } from "@nullplatform/plugin/testing";
import { resolve } from "path";

// The worker as the agent drives it: spawned with the agent's cookie, found by
// its go-plugin handshake, called over gRPC, stopped by a signal. NP_MODE tells
// the entry point it runs locally, so nothing reaches the platform.
describe("{{ .Name }} under the agent's protocol", () => {
  test("handshakes, answers Execute and stops", async () => {
    const client = await startPluginProcess(resolve(import.meta.dir, "../src/index.ts"), { env: { NP_MODE: "test", SUPPRESS_NO_CONFIG_WARNING: "1" } });
    try {
      const response = await client.execute(
        { notification: { id: "a-1", slug: "delete-scope", parameters: { scope_id: "s-1" }, service: { id: "svc-1", attributes: { enabled: true, name: "test" } }, tags: {} } },
        { commandType: "scope" },
      );
      expect(response.events.some((event) => event.started)).toBe(true);
      expect(response.result).not.toBeNull();
    } finally {
      client.stop();
    }
  }, 20000);
});
