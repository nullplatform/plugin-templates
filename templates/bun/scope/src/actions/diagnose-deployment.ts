import type { DeploymentActionInput } from "../index";
import { buildContext } from "../context";

export const diagnoseDeployment = async (notification: DeploymentActionInput, emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  emit({ stdout: `Diagnosing deployment ${ctx.deploymentId}` });
  // TODO: inspect the deployment and collect findings
  return { healthy: true, findings: [] as string[] };
};
