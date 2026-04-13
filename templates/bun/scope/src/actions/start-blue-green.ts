import { workflow } from "@nullplatform/workflow";
import type { DeploymentActionInput } from "../index";
import { buildContext } from "../context";

export const startBlueGreen = workflow<DeploymentActionInput>("{{ .Slug }}:start-blue-green")
  .task("build-context", ({ input }) => buildContext(input))
  .task("deploy", async ({ result: ctx }) => {
    // TODO: implement blue-green deployment
    console.log(`Starting blue-green deployment ${ctx.deploymentId} for scope ${ctx.scopeId}`);
    return { deployment_id: ctx.deploymentId };
  });
