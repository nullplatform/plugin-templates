/**
 * The `connect` link: what a linked application receives. Its attributes are
 * exported to that application (here, one environment variable).
 */

import { ActionError, type ContextOf } from "@nullplatform/plugin/package";
import type { connect } from "./resources";

type Context = ContextOf<typeof connect>;

/** Grant the application access. Returns the link's exported attributes. */
export async function create(ctx: Context): Promise<{ connection_url: string }> {
  // A link reads its service through ctx.service.attributes: what the
  // service's own `create` wrote back.
  const endpoint = (ctx.service.attributes as { endpoint?: string } | undefined)?.endpoint;
  if (!endpoint) {
    throw ActionError.retry("SERVICE_NOT_READY", "the service has no endpoint yet; link again once it is created");
  }
  const user = `np-${String(ctx.link?.id ?? "")}`;
  const url = await ctx.step(`credentials for ${user}`, async () => {
    // Replace: issue a credential scoped to this link (ctx.link.id) on the
    // real dependency and build the URL the application will use.
    return `tcp://${user}@${endpoint}`;
  });
  ctx.log.ok(`${user} can reach ${endpoint}`);
  return { connection_url: url };
}

/** Nothing on this link is editable, so an update changes nothing. */
export async function update(ctx: Context): Promise<Record<string, never>> {
  ctx.log.detail("nothing to change");
  return {};
}

/** Revoke the access. The service itself is untouched. */
export async function remove(ctx: Context): Promise<void> {
  await ctx.step(`revoke np-${String(ctx.link?.id ?? "")}`, async () => {
    // Replace: remove what `create` issued for this link.
  });
}
