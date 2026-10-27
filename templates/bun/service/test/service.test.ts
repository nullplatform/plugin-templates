import { describe, expect, test } from "bun:test";
import { run } from "@nullplatform/plugin/testing";
import manifest from "../package.json" with { type: "json" };
import { connectNarration, serviceNarration } from "../src/plans";
import service from "../src/service";
import connectCreate from "./fixtures/connect-create.json" with { type: "json" };
import connectDelete from "./fixtures/connect-delete.json" with { type: "json" };
import create from "./fixtures/create.json" with { type: "json" };
import remove from "./fixtures/delete.json" with { type: "json" };
import update from "./fixtures/update.json" with { type: "json" };

// run() answers one payload the way the worker does — same routes, same
// lifecycle — with an in-memory platform, and returns what came of it: the
// answer's data or failure, every platform request, the logs and the steps.
// Each fixture is a document as the agent delivers it; run() takes its payload.
const keys = (narration: { plan: { steps: Array<{ key: string }> } }) => narration.plan.steps.map((step) => step.key);
const bodies = (result: { requests: Array<{ body?: unknown }> }) => result.requests.map((request) => request.body);

describe("{{ .Name }}", () => {
  test("the package is package.json's", () => {
    expect(service.package).toMatchObject({ name: manifest.name, version: manifest.version, description: manifest.description });
  });

  test("create provisions the dependency and writes back its endpoint", async () => {
    const result = await run(service, create.notification);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ endpoint: "svc-1.{{ .Slug }}.internal" });
    expect(result.steps.map((step) => step.key)).toEqual(keys(serviceNarration.create));
    expect(bodies(result)).toEqual([
      { status: "in_progress" },
      { messages: [{ level: "info", message: "ready at svc-1.{{ .Slug }}.internal" }] },
      { status: "success", results: { endpoint: "svc-1.{{ .Slug }}.internal" } },
    ]);
  });

  test("update applies the new size", async () => {
    const result = await run(service, update.notification);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
    expect(result.steps.map((step) => step.key)).toEqual(keys(serviceNarration.update));
  });

  test("delete removes what create provisioned, and succeeds when there is nothing", async () => {
    const provisioned = await run(service, remove.notification, { with: { service: { attributes: { endpoint: "svc-1.{{ .Slug }}.internal" } } } });
    expect(provisioned.success).toBe(true);
    expect(provisioned.steps.map((step) => step.key)).toEqual(keys(serviceNarration.delete));
    expect((await run(service, remove.notification)).success).toBe(true);
  });
});

describe("connect link", () => {
  test("create exports a connection url for the linked application", async () => {
    const result = await run(service, connectCreate.notification);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ connection_url: "tcp://np-lnk-9f2a@svc-1.{{ .Slug }}.internal" });
    expect(result.steps.map((step) => step.key)).toEqual(keys(connectNarration.create));
    expect(result.requests.at(-1)?.path).toBe("/link/lnk-9f2a/action/act-4");
  });

  test("before the service is ready the link fails with a retryable error", async () => {
    const result = await run(service, connectCreate.notification, { with: { service: { attributes: { endpoint: "" } } } });
    expect(result.success).toBe(false);
    expect(result.failure).toMatchObject({ code: "SERVICE_NOT_READY", retryable: true });
  });

  test("delete revokes the access", async () => {
    const result = await run(service, connectDelete.notification);
    expect(result.success).toBe(true);
    expect(result.steps.map((step) => step.key)).toEqual(keys(connectNarration.delete));
  });
});
