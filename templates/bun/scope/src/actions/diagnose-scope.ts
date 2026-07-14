import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

// diagnose actions report health; return findings in the result.
export const diagnoseScope = async (notification: ScopeActionInput, emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  emit({ stdout: `Diagnosing scope ${ctx.scopeId}` });
  // TODO: inspect the scope's infrastructure and collect findings
  return { healthy: true, findings: [] as string[] };
};
