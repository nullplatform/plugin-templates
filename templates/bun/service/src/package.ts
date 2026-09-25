import { definePackage } from "@nullplatform/plugin/package";
import manifest from "../package.json" with { type: "json" };
import { svc, connect } from "./resources";
import * as service from "./service";
import * as link from "./connect";

export default definePackage({
  // Baked in at build time from package.json, so the compiled worker knows
  // who it is wherever it runs.
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  resources: [svc, connect],
  // handle() is exhaustive: one handler per declared action, no more, no less.
  handlers: [
    svc.handle({ create: service.create, update: service.update, delete: service.remove }),
    connect.handle({ create: link.create, update: link.update, delete: link.remove }),
  ],
});
