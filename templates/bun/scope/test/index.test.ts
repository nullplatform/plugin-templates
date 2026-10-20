import { describe, test, expect } from "@nullplatform/plugin/testing";
import pkg from "../package.json";
import scope from "../src/scope";

describe("{{ .Name }} plugin", () => {
  test("the manifest declares the scope and its actions", () => {
    const manifest = scope.manifest() as Record<string, any>;

    expect(manifest.name).toBe("{{ .Slug }}");
    expect(manifest.version).toBe(pkg.version);
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
