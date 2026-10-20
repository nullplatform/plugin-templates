import { describe, expect, test } from "bun:test";
import pkg from "../src/package";

// pkg.execute(document) runs the command the way production does — same
// dispatch, same context — with no platform, and returns status, data, error,
// logs and steps.
describe("{{ .Name }}", () => {
  test("hello answers in the same response", async () => {
    const run = await pkg.execute({ action: "hello", name: "Ada" });
    expect(run.status).toBe("success");
    expect(run.data).toEqual({ message: "Hello Ada, from {{ .Name }}" });
    expect(run.steps.map((s) => s.key)).toEqual(["say hello"]);
  });

  test("the command can come nested next to the platform's notification", async () => {
    const run = await pkg.execute({ notification: { package: { slug: "{{ .Slug }}" } }, command: { action: "hello" } });
    expect(run.data).toEqual({ message: "Hello world, from {{ .Name }}" });
  });

  test("an unknown action fails with a name", async () => {
    const run = await pkg.execute({ action: "nope" });
    expect(run.status).toBe("failed");
    expect(run.error?.code).toBe("UNKNOWN_ACTION");
  });
});
