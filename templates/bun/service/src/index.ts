import pkg from "../package.json";
import { defineService, ServiceActions, type ActionContext } from "@nullplatform/plugin/service";

// A SERVICE package defines an application dependency (database, cache, queue…).
// With useDefaultActions the platform generates the create/update/delete action
// specs from `schema` — you only write the handlers below, keyed by action type.
//
// Every handler receives the ONE typed ctx: attributes (what the user
// configured), log (live action messages), emit, and the raw notification.
defineService({
  name: "{{ .Slug }}",
  version: pkg.version,
  category: "database",
  provider: "custom",
  schema: {
    type: "object",
    properties: {
      size: { type: "string", default: "small", visibleOn: ["create", "update"] },
    },
  },
  useDefaultActions: true,
  actions: {
    [ServiceActions.CREATE]: {
      input: { type: "object" },
      handler: async (ctx: ActionContext) => {
        const size = String((ctx.attributes as { size?: string }).size ?? "small");
        ctx.log.step(`provisioning {{ .Slug }} (size=${size})`);
        // TODO: create the real dependency
        ctx.log.ok(`{{ .Slug }} created`);
        return { size, message: "{{ .Slug }} created" };
      },
    },
    [ServiceActions.UPDATE]: {
      input: { type: "object" },
      handler: async (ctx: ActionContext) => {
        ctx.log.step(`updating {{ .Slug }}`);
        // TODO: apply the change to the real dependency
        ctx.log.ok(`{{ .Slug }} updated`);
        return { message: "{{ .Slug }} updated" };
      },
    },
    [ServiceActions.DELETE]: {
      input: { type: "object" },
      handler: async (ctx: ActionContext) => {
        ctx.log.step(`deleting {{ .Slug }}`);
        // TODO: deprovision the real dependency
        ctx.log.ok(`{{ .Slug }} deleted`);
        return { message: "{{ .Slug }} deleted" };
      },
    },
  },
});
