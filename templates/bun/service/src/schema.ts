/**
 * The service's and the link's specifications: the service_specification and
 * link_specification bodies, as the API takes them. Their attributes are the
 * forms the console renders, what each handler reads (`input.parameters`,
 * `input.service.attributes`, `input.link.attributes`) and what it writes
 * back. Handlers take their input types from here; the service itself lives
 * in service.ts, so service → handlers → schema never forms an import cycle.
 */

import type { ActionInputOf, ActionResultOf, LinkActionInputOf, ServiceActions } from "@nullplatform/plugin/service";

export const specification = {
  // Edit: how the catalog groups this service, e.g.
  // { category: "Database", provider: "AWS", sub_category: "Relational Database" }.
  selectors: { category: "Custom", provider: "Custom" },
  attributes: {
    schema: {
      type: "object",
      required: ["size"],
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
      // The console's form layout, which the platform keeps beside the schema. A specification without one renders no form.
      uiSchema: {
        type: "VerticalLayout",
        elements: [{ type: "Control", label: "Size", scope: "#/properties/size" }],
      },
    },
  },
} as const;

/** The `connect` link: what a linked application receives. */
export const connectLink = {
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
} as const;

type Specification = typeof specification;
type DefaultAction = (typeof ServiceActions)[keyof typeof ServiceActions];

/** What a service action's handler gets: its parameters (the attributes, as the platform requires them on it) and the service. */
export type ServiceInput<Key extends DefaultAction> = ActionInputOf<Key, Specification>;

/** What a service action returns: the attributes it changed, which the platform copies into the service's. */
export type ServiceResults<Key extends DefaultAction> = ActionResultOf<Key, Specification>;

/** What a `connect` action's handler gets: its parameters, the service, and the link with its attributes. */
export type ConnectInput<Key extends DefaultAction> = LinkActionInputOf<Key, typeof connectLink, Specification>;

/** What a `connect` action returns: the link's attributes it changed. */
export type ConnectResults<Key extends DefaultAction> = ActionResultOf<Key, typeof connectLink>;
