import { replicasOf, type Context } from "./schema";

export async function createScope(ctx: Context): Promise<void> {
  await ctx.step("prepare scope", async (step) => {
    step.explain({ what: `Scope ${ctx.scopeId} is ready for ${replicasOf(ctx)} replica(s).` });
  });
}

export async function deleteScope(ctx: Context): Promise<void> {
  await ctx.step("remove scope", async (step) => {
    step.explain({ what: `Removed what scope ${ctx.scopeId} owned.` });
  });
}
