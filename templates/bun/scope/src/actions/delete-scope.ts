import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

export const deleteScope = async (notification: ScopeActionInput, _emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  console.log(`Deleting scope ${ctx.scopeId}`);
  return {};
};
