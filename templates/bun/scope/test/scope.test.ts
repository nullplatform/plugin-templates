import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Actions } from "@nullplatform/plugin/package";
import pkg from "../src/package";
import { target } from "../src/resources";

// pkg.run() runs one action the way production does — same dispatch, same
// context — with no platform, and returns what the platform would record:
// status, results, error, logs and steps. `scope` is the scope entity;
// `service.attributes` are the values the user set on it.
const scope = { id: "77", slug: "api-prod" };
const service = { id: "svc-77", slug: "api-prod", attributes: { replicas: 2, asset_url: "ghcr.io/acme/api:1.0.0" } };
const deployment = { scope_id: "77", deployment_id: "d-1" };

describe("{{ .Name }} scope", () => {
  test("create-scope prepares the target and deploys nothing", async () => {
    const run = await pkg.run(target, Actions.CREATE_SCOPE, { scope_id: "77" }, { scope, service });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["prepare scope 77"]);
    expect(run.logs).toContain("✓ scope 77 ready for 2 replica(s)");
  });

  test("delete-scope reclaims the target", async () => {
    const run = await pkg.run(target, Actions.DELETE_SCOPE, { scope_id: "77" }, { scope, service });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["remove scope 77"]);
  });
});

describe("deployments", () => {
  test("start-initial launches the asset", async () => {
    const run = await pkg.run(target, Actions.START_INITIAL, deployment, { scope, service });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["deploy ghcr.io/acme/api:1.0.0"]);
    expect(run.logs).toContain("✓ deployment d-1 running");
  });

  test("finalize-blue-green retires the previous workload", async () => {
    const run = await pkg.run(target, Actions.FINALIZE_BLUE_GREEN, deployment, { scope, service });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["retire the previous workload"]);
  });

  test("rollback-deployment restores the previous workload", async () => {
    const run = await pkg.run(target, Actions.ROLLBACK_DEPLOYMENT, deployment, { scope, service });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["roll back d-1"]);
  });
});

describe("switch-traffic", () => {
  // The one platform call a scope package makes on its own: the platform does
  // not read traffic off the results, so the handler reports it through
  // ctx.deployment.reportTraffic — a PATCH on the deployment. The API is
  // stubbed at the HTTP boundary; the test asserts what it would receive.
  const realFetch = globalThis.fetch;
  const requests: Array<{ method: string; url: string; body: unknown }> = [];

  beforeEach(() => {
    requests.length = 0;
    process.env.NP_API_KEY = "test-key";
    process.env.NP_API_URL = "http://platform.test";
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === "http://platform.test/token") return Response.json({ access_token: "test-token" });
      requests.push({ method: init?.method ?? "GET", url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return Response.json({});
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("routes the weight and reports it to the platform", async () => {
    const run = await pkg.run(target, Actions.SWITCH_TRAFFIC, { ...deployment, weight: 25 }, { scope, service });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["route 25% to d-1"]);
    expect(requests).toEqual([
      { method: "PATCH", url: "http://platform.test/deployment/d-1", body: { strategy_data: { switched_traffic: 25 } } },
    ]);
  });

  test("without a weight there is nothing to route", async () => {
    const run = await pkg.run(target, Actions.SWITCH_TRAFFIC, deployment, { scope, service });
    expect(run.status).toBe("failed");
    expect(run.error?.code).toBe("NO_WEIGHT");
    expect(requests).toEqual([]);
  });
});

describe("log:read", () => {
  test("answers with log lines, as data", async () => {
    const run = await pkg.run(target, Actions.LOG_READ, { scope_id: "77" }, { scope, service });
    expect(run.status).toBe("success");
    expect(run.data).toEqual({ results: [{ message: "[{{ .Slug }}] scope 77 is alive", datetime: expect.any(String) }] });
  });
});
