import { describe, test, expect } from "@nullplatform/plugin-sdk/testing";
import { resolve } from "path";

describe("{{ .Name }} plugin", () => {
  test("--describe outputs valid plugin manifest", async () => {
    const proc = Bun.spawn(
      ["bun", "run", resolve(import.meta.dir, "../src/index.ts"), "--describe"],
      { stdout: "pipe", stderr: "pipe" },
    );
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    const manifest = JSON.parse(output);

    expect(manifest.name).toBe("{{ .Name }}");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.schema.properties.enabled).toBeDefined();
    expect(manifest.actions["create-scope"]).toBeDefined();
    expect(manifest.actions["delete-scope"]).toBeDefined();
    expect(manifest.actions["start-initial"]).toBeDefined();
    expect(manifest.actions["start-blue-green"]).toBeDefined();
    expect(manifest.actions["switch-traffic"]).toBeDefined();
    expect(manifest.actions["finalize-deployment"]).toBeDefined();
    expect(manifest.actions["rollback-deployment"]).toBeDefined();
  });

  test("buildContext parses scope input", async () => {
    const { buildContext } = await import("../src/context");
    const ctx = buildContext({
      parameters: { scope_id: "s-1" },
      service: { attributes: { enabled: true, name: "test" } },
      tags: {},
    } as any);

    expect(ctx.scopeId).toBe("s-1");
    expect(ctx.attributes.enabled).toBe(true);
  });

  test("buildContext parses deployment input", async () => {
    const { buildContext } = await import("../src/context");
    const ctx = buildContext({
      parameters: { scope_id: "s-1", deployment_id: "d-1", weight: 50 },
      service: { attributes: { enabled: true, name: "test" } },
      tags: {},
    } as any);

    expect(ctx.deploymentId).toBe("d-1");
    expect(ctx.weight).toBe(50);
  });
});
