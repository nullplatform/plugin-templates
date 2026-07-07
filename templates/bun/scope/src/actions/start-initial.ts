import type { DeploymentActionInput } from "../index";
import { buildContext } from "../context";

export const startInitial = async (notification: DeploymentActionInput, _emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  console.log("start-initial: scope " + ctx.scopeId + " deployment " + ctx.deploymentId);
  return { deployment_id: ctx.deploymentId };
};
