import { describe, expect, test } from "bun:test";
import { Actions } from "@nullplatform/plugin/package";
import pkg from "../src/package";
import { target } from "../src/resources";

const scope = { id: "77", slug: "orders-prod", dimensions: { environment: "prod" } };
const service = { id: "svc-77", slug: "orders-prod", attributes: { replicas: 2, asset_url: "registry.example.com/orders:1.4.0" } };
const given = { scope, service };
const deployment = { scope_id: "77", deployment_id: "d-9" };

describe("{{ .Name }}", () => {
  test("create-scope", async () => {
    const run = await pkg.run(target, Actions.CREATE_SCOPE, { scope_id: "77" }, given);
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["prepare scope"]);
  });

  test("start-initial reports where the workload answers", async () => {
    const run = await pkg.run(target, Actions.START_INITIAL, deployment, given);
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ endpoint: "https://d-9.{{ .Slug }}.example.com" });
    expect(run.steps.map((s) => s.key)).toEqual(["resolve asset", "launch workload"]);
  });

  test("a deployment without an asset fails", async () => {
    const run = await pkg.run(target, Actions.START_INITIAL, deployment, { scope, service: { ...service, attributes: { replicas: 1 } } });
    expect(run.status).toBe("failed");
    expect(run.error?.code).toBe("NO_ASSET");
  });

  test("switch-traffic reports the weight", async () => {
    const run = await pkg.run(target, Actions.SWITCH_TRAFFIC, { ...deployment, desired_traffic: 30 }, given);
    expect(run.status).toBe("success");
    expect(run.traffic).toEqual([30]);
  });

  test("log:read", async () => {
    const run = await pkg.run(target, Actions.LOG_READ, { scope_id: "77" }, given);
    expect(run.status).toBe("success");
    expect((run.data as { results: unknown[] }).results).toHaveLength(1);
  });
});
