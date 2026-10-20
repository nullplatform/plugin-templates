import { describe, expect, test } from "bun:test";
import { Actions } from "@nullplatform/plugin/package";
import pkg from "../src/package";
import { plans, target } from "../src/resources";

// pkg.run() runs one action the way production does — same dispatch, same
// context — with no platform, and returns what the platform would record:
// status, results, error, logs, steps and the traffic reported.
const scope = { id: "77", slug: "orders-prod", dimensions: { environment: "prod" } };
const service = { id: "svc-77", slug: "orders-prod", attributes: { replicas: 2, asset_url: "registry.example.com/orders:1.4.0" } };
const given = { scope, service };
// The platform sends deployment actions their ids as parameters.
const deployment = { scope_id: "77", deployment_id: "d-9" };

type Plan = { groups: Array<{ key: string }>; steps: Array<{ key: string; group: string }> };
const planOf = (action: string) => (plans as Record<string, Plan>)[action];
const keys = (action: string) => planOf(action).steps.map((s) => s.key);

describe("{{ .Name }}", () => {
  test("create-scope prepares the target", async () => {
    const run = await pkg.run(target, Actions.CREATE_SCOPE, { scope_id: "77" }, given);
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(keys(Actions.CREATE_SCOPE));
  });

  test("start-initial launches the asset and reports where it answers", async () => {
    const run = await pkg.run(target, Actions.START_INITIAL, deployment, given);
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ endpoint: "https://d-9.{{ .Slug }}.example.com" });
    expect(run.steps.map((s) => s.key)).toEqual(keys(Actions.START_INITIAL));
  });

  test("a deployment without an asset fails with a named error", async () => {
    const run = await pkg.run(target, Actions.START_INITIAL, deployment, { scope, service: { ...service, attributes: { replicas: 1 } } });
    expect(run.status).toBe("failed");
    expect(run.error?.code).toBe("NO_ASSET");
  });

  test("switch-traffic reports the weight it moved", async () => {
    const run = await pkg.run(target, Actions.SWITCH_TRAFFIC, { ...deployment, desired_traffic: 30 }, given);
    expect(run.status).toBe("success");
    expect(run.traffic).toEqual([30]);
  });

  test("log:read answers the platform's shape", async () => {
    const run = await pkg.run(target, Actions.LOG_READ, { scope_id: "77" }, given);
    expect(run.status).toBe("success");
    expect((run.data as { results: unknown[] }).results).toHaveLength(1);
  });

  test("every planned step sits in a declared stage", () => {
    for (const [action, plan] of Object.entries(plans as Record<string, Plan>)) {
      const stages = new Set(plan.groups.map((g) => g.key));
      for (const step of plan.steps) expect(stages.has(step.group), `${action}/${step.key}`).toBe(true);
    }
  });
});
