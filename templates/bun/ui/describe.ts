// What `np package publish` reads (`mise run describe`): the package and its one
// bundle, dist/plugin.js, both from manifest.json (its name, its id as the slug,
// its version as the first publish's). Only publish runs it: the bundle never
// imports it.
import { main } from "@nullplatform/plugin";
import { defineUIBundle } from "@nullplatform/plugin/ui";
import manifest from "./manifest.json" with { type: "json" };

export const plugin = defineUIBundle({
  package: { name: manifest.name, slug: manifest.id, version: manifest.version, description: manifest.description },
  manifest,
});

if (import.meta.main) {
  await main(plugin);
}
