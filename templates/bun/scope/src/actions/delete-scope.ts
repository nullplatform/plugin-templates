import { workflow } from "@nullplatform/workflow";
import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

export const deleteScope = workflow<ScopeActionInput>("{{ .Name }}:delete-scope")
  .task("build-context", ({ input }) => buildContext(input))
  .task("delete", async ({ result: ctx }) => {
    // TODO: implement scope deletion
    console.log(`Deleting scope ${ctx.scopeId}`);
  });
