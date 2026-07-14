import pkg from "../package.json";
import { defineService } from "@nullplatform/plugin/service";

// A SERVICE package defines an application dependency (database, cache, queue…).
// With useDefaultActions the platform generates the create/update/delete action
// specs from `schema` — you only write the handlers below, keyed by action type.
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
    create: {
      input: { type: "object" },
      handler: async (notification, emit) => {
        const size = notification.service?.attributes?.size ?? "small";
        emit({ stdout: `provisioning {{ .Slug }} (size=${size})` });
        // TODO: provision the real dependency here.
        return { message: "{{ .Slug }} created" };
      },
    },
    update: {
      input: { type: "object" },
      handler: async (notification, emit) => {
        emit({ stdout: `updating {{ .Slug }}` });
        return { message: "{{ .Slug }} updated" };
      },
    },
    delete: {
      input: { type: "object" },
      handler: async (_notification, emit) => {
        emit({ stdout: `deleting {{ .Slug }}` });
        return { message: "{{ .Slug }} deleted" };
      },
    },
  },
});
