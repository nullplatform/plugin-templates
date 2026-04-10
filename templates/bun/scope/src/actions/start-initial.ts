import { workflow } from "@nullplatform/workflow";
import type { DeploymentActionInput } from "../index";
import { buildContext } from "../context";

export const startInitial = workflow<DeploymentActionInput>("{{ .Name }}:start-initial")
  .task("build-context", ({ input }) => buildContext(input))
  .task("deploy", async ({ result: ctx }) => {
    // TODO: implement initial deployment
    console.log(`Starting initial deployment ${ctx.deploymentId} for scope ${ctx.scopeId}`);
    return { deployment_id: ctx.deploymentId };
  });
