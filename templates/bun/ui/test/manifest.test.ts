import { describe, expect, test } from "bun:test";
import { isApiRequestAllowed, validatePublishableManifest, type ApiPermission } from "@nullplatform/ui-plugin-sdk/contract";
import { describeUIPlugin } from "@nullplatform/ui-plugin-sdk/standard";
import manifest from "../manifest.json";
import { widgets } from "../src/widgets";

// manifest.json is the plugin's definition: what it contributes, where, and what
// it may call. The API checks it at publish as validatePublishableManifest does.

describe("manifest.json", () => {
  test("is publishable as the API checks it", () => {
    expect(() => validatePublishableManifest(manifest)).not.toThrow();
  });

  test("contributes only widgets the plugin defines", () => {
    const missing = manifest.contributes.map((contribution) => contribution.widget).filter((widget) => !(widget in widgets));
    expect(missing).toEqual([]);
  });

  test("allows exactly the API calls the widgets make", () => {
    const api = manifest.permissions.api as ApiPermission[];
    expect(isApiRequestAllowed(api, "GET", "/application/42")).toBe(true);
    expect(isApiRequestAllowed(api, "DELETE", "/application/42")).toBe(false);
  });
});

describe("describe", () => {
  test("is one ui_bundle, uploaded from dist/plugin.js, with no worker: what np package publish registers", () => {
    const described = describeUIPlugin(manifest);
    expect(described.slug).toBe(manifest.id);
    expect(described.components.map((component) => [component.resource_type, component.upload?.file])).toEqual([["ui_bundle", "dist/plugin.js"]]);
    expect([described.worker, described.runs]).toEqual([false, []]);
  });
});
