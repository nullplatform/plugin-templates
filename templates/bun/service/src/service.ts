/**
 * The service's actions: create, update, delete. Each is a plain function of
 * the handler context. What `create` and `update` return becomes the
 * service's attributes, so it must fit the schema in schema.ts.
 *
 * Each `ctx.step(name, (step) => …)` is a step on the action's trace: its name
 * matches the plan in resources.ts, and `step.explain` says what happened.
 */

import type { ServiceContext as Context } from "./schema";

/** Provision the dependency and report where it listens. */
export async function create(ctx: Context): Promise<{ endpoint: string }> {
  const size = ctx.params.size ?? "small";
  const endpoint = await ctx.step("provision", async (step) => {
    // Replace: create the real thing — a database, a cache, a queue — sized by
    // `size`, and return the address applications will use. ctx.service is the
    // service entity the platform sent (id, name, nrn, dimensions…).
    const at = `${String(ctx.service.id)}.{{ .Slug }}.internal`;
    step.explain({ what: `A ${size} {{ .Name }} answers at ${at}.`, why: "Applications that link the service connect there." });
    step.output("endpoint", { endpoint: at, size });
    return at;
  });
  ctx.log.ok(`ready at ${endpoint}`);
  ctx.trace.explain({ title: "{{ .Name }} ready", what: `Listening at ${endpoint}.`, next: "Link it from an application." });
  return { endpoint };
}

/** Apply a changed input. Returns the attributes that changed (none here). */
export async function update(ctx: Context): Promise<Record<string, never>> {
  const size = ctx.params.size ?? "small";
  await ctx.step("resize", async (step) => {
    // Replace: apply the new size to the real dependency.
    step.explain({ what: `Resized to ${size}.` });
  });
  return {};
}

/** Tear the dependency down. Nothing to return; a retry must find nothing to do. */
export async function remove(ctx: Context): Promise<void> {
  const endpoint = ctx.params.endpoint;
  await ctx.step("deprovision", async (step) => {
    if (!endpoint) {
      step.explain({ what: "Never provisioned; nothing to delete." });
      return;
    }
    // Replace: delete the real dependency. Treat "already gone" as success.
    step.explain({ what: `Deleted the dependency at ${endpoint}.` });
  });
}
