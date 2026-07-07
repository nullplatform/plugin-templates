import type { DeploymentActionInput } from "../index";
import { buildContext } from "../context";

export const deleteDeployment = async (notification: DeploymentActionInput, emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  emit({ stdout: `Deleting deployment ${ctx.deploymentId} of scope ${ctx.scopeId}` });
  // TODO: tear down the deployment's resources
  return { message: `Deployment ${ctx.deploymentId} deleted` };
};
