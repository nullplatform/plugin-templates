/**
 * What this package publishes: the {{ .Name }} service and its `connect`
 * link. Every field here is one of the service API's own (`use_default_actions`,
 * `assignable_to`, `sub_category`, …) written in camelCase; the schemas are
 * the ones the platform renders, verbatim.
 */

import { service, link } from "@nullplatform/plugin/package";

export const svc = service({
  slug: "{{ .Slug }}",
  name: "{{ .Name }}",
  // Edit: how the catalog groups this service, e.g.
  // { category: "Database", provider: "AWS", subCategory: "Relational Database" }.
  selectors: { category: "Custom", provider: "Custom" },
  attributes: {
    schema: {
      type: "object",
      properties: {
        // An input: what the user picks when creating or updating the service.
        size: {
          type: "string",
          title: "Size",
          enum: ["small", "medium", "large"],
          default: "small",
          editableOn: ["create", "update"],
          order: 1,
        },
        // An output: written back by `create`, shown on the service and
        // exported to the applications that link it. Never edited by hand.
        endpoint: {
          type: "string",
          title: "Endpoint",
          description: "Where the dependency listens (filled in by create)",
          export: true,
          visibleOn: ["read"],
          editableOn: [],
          order: 2,
        },
      },
    },
  },
});

export const connect = link(svc, {
  slug: "connect",
  name: "Connect",
  attributes: {
    schema: {
      type: "object",
      properties: {
        // Written back by the link's `create` and delivered to the linked
        // application as an environment variable.
        connection_url: {
          type: "string",
          title: "Connection URL",
          export: { type: "environment_variable" },
          visibleOn: ["read"],
          editableOn: [],
          order: 1,
        },
      },
    },
  },
});
