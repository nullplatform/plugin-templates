import { describe, expect, test } from "bun:test";
import pkg from "../src/package";
import { connect, svc } from "../src/resources";

const service = { id: "svc-1", name: "Orders API", attributes: {} };
const ready = { ...service, attributes: { size: "small", endpoint: "svc-1.{{ .Slug }}.internal" } };
const link = { id: "lnk-9f2a", attributes: {} };

describe("{{ .Name }}", () => {
  test("create writes back the endpoint", async () => {
    const run = await pkg.run(svc, "create", { size: "medium" }, { service });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ endpoint: "svc-1.{{ .Slug }}.internal" });
  });

  test("update", async () => {
    const run = await pkg.run(svc, "update", { size: "large" }, { service: ready });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({});
  });

  test("delete", async () => {
    const run = await pkg.run(svc, "delete", {}, { service: ready });
    expect(run.status).toBe("success");
  });
});

describe("connect", () => {
  test("create exports a connection url", async () => {
    const run = await pkg.run(connect, "create", {}, { service: ready, link });
    expect(run.status).toBe("success");
    expect(run.results).toEqual({ connection_url: "tcp://np-lnk-9f2a@svc-1.{{ .Slug }}.internal" });
  });

  test("create before the service is ready is retried", async () => {
    const run = await pkg.run(connect, "create", {}, { service, link });
    expect(run.status).toBe("failed");
    expect(run.error).toMatchObject({ code: "SERVICE_NOT_READY", retryable: true });
  });

  test("delete", async () => {
    const run = await pkg.run(connect, "delete", {}, { service: ready, link });
    expect(run.status).toBe("success");
  });
});
