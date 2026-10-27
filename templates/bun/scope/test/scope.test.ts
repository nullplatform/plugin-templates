import { describe, expect, test } from "bun:test";
import { ScopeActions } from "@nullplatform/plugin/scope";
import { run } from "@nullplatform/plugin/testing";
import manifest from "../package.json" with { type: "json" };
import { narration } from "../src/plans";
import scope from "../src/scope";
import createScope from "./fixtures/create-scope.json" with { type: "json" };
import logRead from "./fixtures/log-read.json" with { type: "json" };
import startInitial from "./fixtures/start-initial.json" with { type: "json" };
import switchTraffic from "./fixtures/switch-traffic.json" with { type: "json" };

// run() answers one payload the way the worker does — same routes, same
// lifecycle — with an in-memory platform, and returns what came of it: the
// answer's data or failure, every platform request, the logs and the steps.
// Each fixture is a document as the agent delivers it; run() takes its payload.
const planned = (action: keyof typeof narration) => narration[action].plan.steps.map((step) => step.key);
const bodies = (result: { requests: Array<{ body?: unknown }> }) => result.requests.map((request) => request.body);

describe("{{ .Name }}", () => {
  test("the package is package.json's", () => {
    expect(scope.package).toMatchObject({ name: manifest.name, version: manifest.version, description: manifest.description });
  });

  test("describe publishes the scope type", () => {
    const scopeType = scope.manifest().components.find((component) => component.resource_type === "scope_type");
    expect(scopeType?.resource).toMatchObject({ name: "{{ .Name }}", description: "Deploy applications to {{ .Name }}" });
  });

  test("create-scope prepares the target and reports the action", async () => {
    const result = await run(scope, createScope.notification);
    expect(result.success).toBe(true);
    expect(result.steps.map((step) => step.key)).toEqual(planned(ScopeActions.CREATE_SCOPE));
    expect(bodies(result)).toEqual([
      { status: "in_progress" },
      { messages: [{ level: "info", message: "scope 77 ready for 2 replica(s)" }] },
      { status: "success", results: {} },
    ]);
  });

  test("start-initial launches the asset and reports where it answers", async () => {
    const result = await run(scope, startInitial.notification);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ endpoint: "https://d-9.{{ .Slug }}.example.com" });
    expect(result.steps.map((step) => step.key)).toEqual(planned(ScopeActions.START_INITIAL));
    expect(bodies(result).at(-1)).toEqual({ status: "success", results: { endpoint: "https://d-9.{{ .Slug }}.example.com" } });
  });

  test("a deployment without an asset fails with a named error", async () => {
    const result = await run(scope, startInitial.notification, { with: { service: { attributes: { asset_url: "" } } } });
    expect(result.success).toBe(false);
    expect(result.failure?.code).toBe("NO_ASSET");
  });

  test("switch-traffic reports the weight it moved on the deployment", async () => {
    const result = await run(scope, switchTraffic.notification);
    expect(result.success).toBe(true);
    expect(result.requests).toContainEqual({ method: "PATCH", path: "/deployment/d-9", body: { strategy_data: { switched_traffic: 30 } } });
  });

  test("log:read answers the platform's shape, with no lifecycle", async () => {
    const result = await run(scope, logRead.notification);
    expect(result.success).toBe(true);
    expect((result.data as { results: unknown[] }).results).toHaveLength(1);
    expect(result.requests).toEqual([]);
  });
});
