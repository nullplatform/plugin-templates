import { describe, expect, test } from "bun:test";
import pkg from "../src/package";

describe("{{ .Name }}", () => {
  test("hello", async () => {
    const run = await pkg.execute({ action: "hello", name: "Ada" });
    expect(run.status).toBe("success");
    expect(run.data).toEqual({ message: "Hello, Ada!" });
  });

  test("an unknown action fails", async () => {
    const run = await pkg.execute({ action: "nope" });
    expect(run.status).toBe("failed");
    expect(run.error?.code).toBe("UNKNOWN_ACTION");
  });
});
