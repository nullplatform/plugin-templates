import { workflow } from "@nullplatform/workflow";
import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

export const finalizeDeployment = workflow<ScopeActionInput>("{{ .Name }}:finalize-deployment")
  .task("build-context", ({ input }) => buildContext(input))
  .task("finalize", async ({ result: ctx }) => {
    // TODO: implement deployment finalization (cleanup old version)
    console.log(`Finalizing deployment for scope ${ctx.scopeId}`);
  });
