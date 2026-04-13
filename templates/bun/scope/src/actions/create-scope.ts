import { workflow } from "@nullplatform/workflow";
import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

export const createScope = workflow<ScopeActionInput>("{{ .Slug }}:create-scope")
  .task("build-context", ({ input }) => buildContext(input))
  .task("create", async ({ result: ctx }) => {
    // TODO: implement scope creation
    console.log(`Creating scope ${ctx.scopeId}`);
    return { message: `Scope ${ctx.scopeId} created` };
  });
