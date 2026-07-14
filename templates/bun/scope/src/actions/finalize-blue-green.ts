import type { DeploymentActionInput } from "../index";
import { buildContext } from "../context";

export const finalizeBlueGreen = async (notification: DeploymentActionInput, _emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  console.log("finalize-blue-green: scope " + ctx.scopeId + " deployment " + ctx.deploymentId);
  return { deployment_id: ctx.deploymentId };
};
