import type { DeploymentActionInput } from "../index";
import { buildContext } from "../context";

export const rollbackDeployment = async (notification: DeploymentActionInput, _emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  console.log("rollback-deployment: scope " + ctx.scopeId + " deployment " + ctx.deploymentId);
  return { deployment_id: ctx.deploymentId };
};
