/**
 * The scope's specification: the service_specification body, as the API
 * takes it. Its attributes are the form the console renders, what each
 * handler reads as `input.service.attributes`, and what a deployment reports
 * back. Handlers take their input types from here; the scope itself lives in
 * scope.ts, so scope → handlers → schema never forms an import cycle.
 */

import type { DeploymentActionInputOf, ScopeActionInputOf, ScopeActions, ScopeResultOf } from "@nullplatform/plugin/scope";

export const specification = {
  // Edit: how the console groups this scope type (category) and what it deploys to (provider).
  selectors: { category: "Scope", provider: "Custom" },
  attributes: {
    schema: {
      type: "object",
      // The console's scope form shows exactly the properties listed in
      // `required`. Give every input a default so "required" costs the user nothing.
      required: ["replicas"],
      properties: {
        // An input: what the user sets when creating the scope.
        replicas: { type: "integer", title: "Replicas", default: 1, minimum: 1, order: 1 },
        // What the release ships, as the platform sends it on a deployment action.
        asset_url: { type: "string", title: "Asset", visibleOn: ["read"] },
        // An output: what a deployment reports back (visibleOn read). The
        // platform copies an action's results into the attributes it declares.
        endpoint: { type: "string", title: "Endpoint", visibleOn: ["read"] },
      },
      // The console's form layout, which the platform keeps beside the schema. A specification without one renders no form.
      uiSchema: {
        type: "VerticalLayout",
        elements: [{ type: "Control", label: "Replicas", scope: "#/properties/replicas" }],
      },
    },
  },
} as const;

type Specification = typeof specification;
type Action = (typeof ScopeActions)[keyof typeof ScopeActions];

/** What a scope action's handler gets: its parameters, the scope, and the scope's attributes as stored. */
export type ScopeInput<Key extends Action> = ScopeActionInputOf<Key, Specification>;

/** What a deployment action's handler gets: a scope action's input, with the deployment always there. */
export type DeploymentInput<Key extends Action> = DeploymentActionInputOf<Key, Specification>;

/** What a lifecycle action returns: the attributes it changed, which the platform copies into the scope's. */
export type Results = ScopeResultOf<typeof ScopeActions.CREATE_SCOPE, Specification>;

/** The replicas the scope runs: what the user set, at least one. */
export const replicasOf = (input: { service: { attributes: { replicas?: number } } }): number =>
  Math.max(1, Number(input.service.attributes.replicas ?? 1));
