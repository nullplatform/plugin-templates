/**
 * What this package publishes: the {{ .Name }} service and its `connect`
 * link, each with the handler of every action and how it reads on the trace.
 * A default action (create, update, delete) is found by its type, a link's by
 * the link's slug; each is answered with its lifecycle on the platform.
 * Nothing runs on import: src/index.ts runs it.
 */

import { defineService, ServiceActions } from "@nullplatform/plugin/service";
import manifest from "../package.json" with { type: "json" };
import * as connect from "./connect";
import * as dependency from "./dependency";
import { connectNarration, serviceNarration } from "./plans";
import { connectLink, specification } from "./schema";

export default defineService({
  // The package, as package.json declares it: baked in at build time, so the compiled worker knows who it is wherever it runs.
  package: { name: manifest.name, version: manifest.version, description: manifest.description },
  specification,
  actions: {
    [ServiceActions.CREATE]: { ...serviceNarration.create, handler: dependency.create },
    [ServiceActions.UPDATE]: { ...serviceNarration.update, handler: dependency.update },
    [ServiceActions.DELETE]: { ...serviceNarration.delete, handler: dependency.remove },
  },
  links: {
    connect: {
      specification: connectLink,
      actions: {
        [ServiceActions.CREATE]: { ...connectNarration.create, handler: connect.create },
        [ServiceActions.UPDATE]: connect.update,
        [ServiceActions.DELETE]: { ...connectNarration.delete, handler: connect.remove },
      },
    },
  },
});
