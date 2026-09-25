/**
 * The service's actions: create, update, delete. Each is a plain function of
 * the handler context. What `create` and `update` return becomes the
 * service's attributes, so it must fit the schema in resources.ts.
 */

import type { ContextOf } from "@nullplatform/plugin/package";
import type { svc } from "./resources";

type Context = ContextOf<typeof svc>;

/** Provision the dependency and report where it listens. */
export async function create(ctx: Context): Promise<{ endpoint: string }> {
  const size = ctx.params.size ?? "small";
  const endpoint = await ctx.step(`provision (${size})`, async () => {
    // Replace: create the real thing — a database, a cache, a queue — sized by
    // `size`, and return the address applications will use. ctx.service is the
    // service entity the platform sent (id, name, nrn, dimensions…).
    return `${String(ctx.service.id)}.{{ .Slug }}.internal`;
  });
  ctx.log.ok(`ready at ${endpoint}`);
  return { endpoint };
}

/** Apply a changed input. Returns the attributes that changed (none here). */
export async function update(ctx: Context): Promise<Record<string, never>> {
  await ctx.step(`resize to ${ctx.params.size ?? "small"}`, async () => {
    // Replace: apply the new size to the real dependency.
  });
  return {};
}

/** Tear the dependency down. Nothing to return; a retry must find nothing to do. */
export async function remove(ctx: Context): Promise<void> {
  const endpoint = ctx.params.endpoint;
  if (!endpoint) {
    ctx.log.detail("never provisioned; nothing to delete");
    return;
  }
  await ctx.step(`delete ${endpoint}`, async () => {
    // Replace: delete the real dependency. Treat "already gone" as success.
  });
}
