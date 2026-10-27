/**
 * The `connect` link: what a linked application receives. Its attributes are
 * exported to that application (here, one environment variable). A link's
 * handler reads its service through `input.service.attributes` — what the
 * service's own `create` wrote back — and its link through `input.link`.
 */

import { ActionError, type Context } from "@nullplatform/plugin";
import type { ConnectInput, ConnectResults } from "./schema";

const userOf = (input: { link: { id: string } }) => `np-${input.link.id}`;

/** Grant the application access. Returns the link's exported attributes. */
export async function create(input: ConnectInput<"create">, context: Context): Promise<ConnectResults<"create">> {
  const endpoint = input.service.attributes.endpoint;
  if (!endpoint) {
    throw new ActionError("SERVICE_NOT_READY", "the service has no endpoint yet; link again once it is created", { retryable: true });
  }
  const user = userOf(input);
  const url = await context.trace.step("grant-access", async (step) => {
    // Replace: issue a credential scoped to this link (input.link.id) on the
    // real dependency and build the URL the application will use.
    step.explain({ what: `${user} can reach ${endpoint}.`, why: "Each linked application gets its own credential, revoked with the link." });
    return `tcp://${user}@${endpoint}`;
  });
  context.log.info(`${user} can reach ${endpoint}`);
  return { connection_url: url };
}

/** Nothing on this link is editable, so an update changes nothing. */
export async function update(input: ConnectInput<"update">, context: Context): Promise<ConnectResults<"update">> {
  context.log.debug(`nothing to change on ${userOf(input)}`);
  return {};
}

/** Revoke the access. The service itself is untouched. */
export async function remove(input: ConnectInput<"delete">, context: Context): Promise<ConnectResults<"delete">> {
  await context.trace.step("revoke-access", async (step) => {
    // Replace: remove what `create` issued for this link.
    step.explain({ what: `Revoked ${userOf(input)}.` });
  });
  return {};
}
