import { workflow } from "@nullplatform/workflow";
import type { DeploymentActionInput } from "../scope";
import { buildContext } from "../context";

export const switchTraffic = workflow<DeploymentActionInput>("{{ .Slug }}:switch-traffic")
  .task("build-context", ({ input }) => buildContext(input))
  .task("switch", async ({ result: ctx }) => {
    // TODO: implement traffic switch
    console.log(`Switching traffic for scope ${ctx.scopeId} (weight: ${ctx.weight})`);
  });
