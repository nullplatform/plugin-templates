import { describe, expect, test } from "bun:test";
import pkg from "../src/package";
import { svc, connect } from "../src/resources";

// pkg.run() runs one action the way production does — same dispatch, same
// context — with no platform, and returns what the platform would record:
// status, results, error, logs and steps.
const service = { id: "svc-1", name: "Orders API", attributes: {} };
const ready = { ...service, attributes: { endpoint: "svc-1.{{ .Slug }}.internal" } };

describe("{{ .Name }}", () => {
  test("create provisions the dependency and writes back its endpoint", async () => {
    const run = await pkg.run(svc, "create", { size: "medium" }, { service });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ endpoint: "svc-1.{{ .Slug }}.internal" });
    expect(run.steps.map((s) => s.key)).toEqual(["provision (medium)"]);
    expect(run.logs).toContain("✓ ready at svc-1.{{ .Slug }}.internal");
  });

  test("update applies the new size; params are the attributes merged with the input", async () => {
    const run = await pkg.run(svc, "update", { size: "large" }, { service: ready });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({});
    expect(run.steps.map((s) => s.key)).toEqual(["resize to large"]);
  });

  test("delete removes what create provisioned", async () => {
    const run = await pkg.run(svc, "delete", {}, { service: ready });
    expect(run.status).toBe("success");
    expect(run.results).toBeUndefined();
    expect(run.steps.map((s) => s.key)).toEqual(["delete svc-1.{{ .Slug }}.internal"]);
  });

  test("delete of a service that was never provisioned is a success", async () => {
    const run = await pkg.run(svc, "delete", {}, { service });
    expect(run.status).toBe("success");
    expect(run.steps).toEqual([]);
  });
});

describe("connect link", () => {
  const link = { id: "lnk-9f2a", attributes: {} };

  test("create exports a connection url for the linked application", async () => {
    const run = await pkg.run(connect, "create", {}, { service: ready, link });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ connection_url: "tcp://np-lnk-9f2a@svc-1.{{ .Slug }}.internal" });
    expect(run.steps.map((s) => s.key)).toEqual(["credentials for np-lnk-9f2a"]);
  });

  test("before the service is ready the link fails with a retryable error", async () => {
    const run = await pkg.run(connect, "create", {}, { service, link });
    expect(run.status).toBe("failed");
    expect(run.error).toMatchObject({ code: "SERVICE_NOT_READY", retryable: true });
  });

  test("delete revokes the access", async () => {
    const run = await pkg.run(connect, "delete", {}, { service: ready, link });
    expect(run.status).toBe("success");
    expect(run.steps.map((s) => s.key)).toEqual(["revoke np-lnk-9f2a"]);
  });
});
