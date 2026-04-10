import { workflow } from "@nullplatform/workflow";
import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

export const rollbackDeployment = workflow<ScopeActionInput>("{{ .Name }}:rollback-deployment")
  .task("build-context", ({ input }) => buildContext(input))
  .task("rollback", async ({ result: ctx }) => {
    // TODO: implement deployment rollback
    console.log(`Rolling back deployment for scope ${ctx.scopeId}`);
  });
