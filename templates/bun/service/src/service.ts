import type { ServiceContext as Context } from "./schema";

export async function create(ctx: Context): Promise<{ endpoint: string }> {
  const size = ctx.params.size ?? "small";

  const endpoint = await ctx.step("provision", async (step) => {
    const at = `${String(ctx.service.id)}.{{ .Slug }}.internal`;
    step.explain({ what: `A ${size} {{ .Name }} answers at ${at}.` });
    return at;
  });

  return { endpoint };
}

export async function update(ctx: Context): Promise<Record<string, never>> {
  const size = ctx.params.size ?? "small";

  await ctx.step("resize", async (step) => {
    step.explain({ what: `Resized to ${size}.` });
  });

  return {};
}

export async function remove(ctx: Context): Promise<void> {
  await ctx.step("deprovision", async () => {});
}
