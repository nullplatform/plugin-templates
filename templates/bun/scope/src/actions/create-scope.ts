import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

// emit({ stdout }) shows up as a live message on the action in the UI.
export const createScope = async (notification: ScopeActionInput, emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  emit({ stdout: `Creating scope ${ctx.scopeId}` });
  // TODO: provision infrastructure here
  return { message: `Scope ${ctx.scopeId} created` };
};
