import { describe, expect, test } from "bun:test";
import pkg from "../src/package";
import { connect, linkPlans, servicePlans, svc } from "../src/resources";

// pkg.run() runs one action the way production does — same dispatch, same
// context — with no platform, and returns what the platform would record:
// status, results, error, logs and steps.
const service = { id: "svc-1", name: "Orders API", attributes: {} };
const ready = { ...service, attributes: { size: "small", endpoint: "svc-1.{{ .Slug }}.internal" } };
const keys = (p: { steps: Array<{ key: string }> }) => p.steps.map((s) => s.key);

describe("{{ .Name }}", () => {
  test("create provisions the dependency and writes back its endpoint", async () => {
    const run = await pkg.run(svc, "create", { size: "medium" }, { service });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ endpoint: "svc-1.{{ .Slug }}.internal" });
    expect(run.steps.map((s) => s.key)).toEqual(keys(servicePlans.create));
    expect(run.logs).toContain("✓ ready at svc-1.{{ .Slug }}.internal");
  });

  test("update applies the new size", async () => {
    const run = await pkg.run(svc, "update", { size: "large" }, { service: ready });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({});
    expect(run.steps.map((s) => s.key)).toEqual(keys(servicePlans.update));
  });

  test("delete removes what create provisioned, and succeeds when there is nothing", async () => {
    expect((await pkg.run(svc, "delete", {}, { service: ready })).status).toBe("success");
    expect((await pkg.run(svc, "delete", {}, { service })).status).toBe("success");
  });
});

describe("connect link", () => {
  const link = { id: "lnk-9f2a", attributes: {} };

  test("create exports a connection url for the linked application", async () => {
    const run = await pkg.run(connect, "create", {}, { service: ready, link });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ connection_url: "tcp://np-lnk-9f2a@svc-1.{{ .Slug }}.internal" });
    expect(run.steps.map((s) => s.key)).toEqual(keys(linkPlans.create));
  });

  test("before the service is ready the link fails with a retryable error", async () => {
    const run = await pkg.run(connect, "create", {}, { service, link });
    expect(run.status).toBe("failed");
    expect(run.error).toMatchObject({ code: "SERVICE_NOT_READY", retryable: true });
  });

  test("delete revokes the access", async () => {
    const run = await pkg.run(connect, "delete", {}, { service: ready, link });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(keys(linkPlans.delete));
  });
});
