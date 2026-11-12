// What `np package publish` reads (`mise run describe`): the package, as
// package.json declares it, and its one bundle, dist/plugin.js, described from
// manifest.json. Only publish runs it: the bundle never imports it.
import { main } from "@nullplatform/plugin";
import { defineUIBundle } from "@nullplatform/plugin/ui";
import manifest from "./manifest.json" with { type: "json" };
import pkg from "./package.json" with { type: "json" };

export const plugin = defineUIBundle({
  package: { name: pkg.name, version: pkg.version, description: pkg.description },
  manifest,
});

if (import.meta.main) {
  await main(plugin);
}
