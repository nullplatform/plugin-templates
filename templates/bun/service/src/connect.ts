import { ActionError } from "@nullplatform/plugin/package";
import type { LinkContext as Context } from "./schema";

const userOf = (ctx: Context) => `np-${String(ctx.link?.id ?? "")}`;

export async function create(ctx: Context): Promise<{ connection_url: string }> {
  const endpoint = (ctx.service.attributes as { endpoint?: string } | undefined)?.endpoint;
  if (!endpoint) throw ActionError.retry("SERVICE_NOT_READY", "The service has no endpoint yet");

  const url = await ctx.step("grant access", async (step) => {
    step.explain({ what: `${userOf(ctx)} can reach ${endpoint}.` });
    return `tcp://${userOf(ctx)}@${endpoint}`;
  });

  return { connection_url: url };
}

export async function update(): Promise<Record<string, never>> {
  return {};
}

export async function remove(ctx: Context): Promise<void> {
  await ctx.step("revoke access", async () => {});
}
