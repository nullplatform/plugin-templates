/**
 * What this package is: one `execute()` route, which answers any document the
 * agent hands over. Nothing runs on import: src/index.ts runs it.
 */

import { definePlugin, execute } from "@nullplatform/plugin";
import manifest from "../package.json" with { type: "json" };
import { handle } from "./handler";

export default definePlugin({
  // The package, as package.json declares it: baked in at build time, so the compiled worker knows who it is wherever it runs.
  package: { name: manifest.name, version: manifest.version, description: manifest.description },
  // execute() matches anything, so it goes last once you add routes before it (an event, say).
  routes: [execute(handle)],
});
