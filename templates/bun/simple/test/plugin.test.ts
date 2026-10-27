import { describe, expect, test } from "bun:test";
import { run } from "@nullplatform/plugin/testing";
import manifest from "../package.json" with { type: "json" };
import plugin from "../src/plugin";
import hello from "./fixtures/hello.json" with { type: "json" };

// run() answers one document the way the worker does — same route, same
// context — with an in-memory platform, and returns what came of it: the
// answer's data or failure, what the worker prints, the logs and the steps.
describe("{{ .Name }}", () => {
  test("the package is package.json's", () => {
    expect(plugin.package).toMatchObject({ name: manifest.name, version: manifest.version, description: manifest.description });
  });

  test("hello answers in the same response", async () => {
    const result = await run(plugin, hello);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: "Hello Ada, from {{ .Name }}" });
    expect(JSON.parse(result.stdout)).toEqual({ success: true, data: { message: "Hello Ada, from {{ .Name }}" } });
    expect(result.steps.map((step) => step.key)).toEqual(["say-hello"]);
  });

  test("a document without a name says hello to the world", async () => {
    const result = await run(plugin, { action: "hello" });
    expect(result.data).toEqual({ message: "Hello world, from {{ .Name }}" });
  });

  test("an unknown action fails with a name", async () => {
    const result = await run(plugin, { action: "nope" });
    expect(result.success).toBe(false);
    expect(result.failure?.code).toBe("UNKNOWN_ACTION");
  });

  test("a document without an action is refused", async () => {
    const result = await run(plugin, { name: "Ada" });
    expect(result.success).toBe(false);
    expect(result.failure?.code).toBe("BAD_REQUEST");
  });
});
