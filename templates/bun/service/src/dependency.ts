/**
 * The service's actions: create, update, delete. Each is a function of
 * `(input, context)`: `input` is what the platform sent (`input.parameters`,
 * the attributes asked for; `input.service`, the entity with its attributes
 * as stored), `context` the SDK's tools. What `create` and `update` return
 * becomes the service's attributes, so it must fit the schema in schema.ts.
 *
 * Each `context.trace.step(key, (step) => …)` is a step on the action's
 * trace: its key matches the plan in plans.ts, and `step.explain` says what
 * happened.
 */

import type { Context } from "@nullplatform/plugin";
import type { ServiceInput, ServiceResults } from "./schema";

/** Provision the dependency and report where it listens. */
export async function create(input: ServiceInput<"create">, context: Context): Promise<ServiceResults<"create">> {
  const size = input.parameters.size;
  const endpoint = await context.trace.step("provision", async (step) => {
    // Replace: create the real thing — a database, a cache, a queue — sized by
    // `size`, and return the address applications will use. input.service is
    // the service entity the platform sent (id, slug, dimensions…).
    const at = `${input.service.id}.{{ .Slug }}.internal`;
    step.explain({ what: `A ${size} {{ .Name }} answers at ${at}.`, why: "Applications that link the service connect there." });
    step.output("endpoint", { endpoint: at, size });
    return at;
  });
  context.log.info(`ready at ${endpoint}`);
  context.trace.explain({ title: "{{ .Name }} ready", what: `Listening at ${endpoint}.`, next: "Link it from an application." });
  return { endpoint };
}

/** Apply a changed input. Returns the attributes that changed (none here). */
export async function update(input: ServiceInput<"update">, context: Context): Promise<ServiceResults<"update">> {
  const size = input.parameters.size;
  await context.trace.step("resize", async (step) => {
    // Replace: apply the new size to the real dependency.
    step.explain({ what: `Resized to ${size}.` });
  });
  return {};
}

/** Tear the dependency down. A retry must find nothing to do. */
export async function remove(input: ServiceInput<"delete">, context: Context): Promise<ServiceResults<"delete">> {
  const endpoint = input.service.attributes.endpoint;
  await context.trace.step("deprovision", async (step) => {
    if (!endpoint) {
      step.explain({ what: "Never provisioned; nothing to delete." });
      return;
    }
    // Replace: delete the real dependency. Treat "already gone" as success.
    step.explain({ what: `Deleted the dependency at ${endpoint}.` });
  });
  return {};
}
