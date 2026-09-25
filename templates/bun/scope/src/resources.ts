/**
 * What this package publishes: the {{ .Name }} scope and its scope type.
 * `scope()` is a service specification with `type: "scope"` whose actions are
 * the platform's well-known scope actions; `scopeType()` is what makes the
 * type creatable in the console. Every field is one of the service API's own,
 * written in camelCase; the schema is the one the platform renders, verbatim.
 */

import { scope, scopeType, Actions } from "@nullplatform/plugin/package";

export const target = scope({
  slug: "{{ .Slug }}",
  name: "{{ .Name }}",
  // Edit: how the console groups this scope type (category) and what it
  // deploys to (provider), e.g. { category: "Scope", provider: "AWS" }.
  selectors: { category: "Scope", provider: "Custom" },
  attributes: {
    schema: {
      type: "object",
      properties: {
        // What the user sets when creating the scope; arrives in ctx.params.
        replicas: { type: "integer", title: "Replicas", default: 1, minimum: 1, order: 1 },
      },
    },
  },
  // The lifecycle this package answers. Each entry needs a handler in
  // package.ts; handle() refuses a missing or an extra one.
  actions: [
    Actions.CREATE_SCOPE,
    Actions.DELETE_SCOPE,
    Actions.START_INITIAL,
    Actions.SWITCH_TRAFFIC,
    Actions.FINALIZE_BLUE_GREEN,
    Actions.ROLLBACK_DEPLOYMENT,
  ],
  // Telemetry adds data actions: logs → log:read; instances → instance:data.
  telemetry: { logs: true },
});

export const targetType = scopeType(target, {
  name: "{{ .Name }}",
  description: "Deploy applications to {{ .Name }}",
});
