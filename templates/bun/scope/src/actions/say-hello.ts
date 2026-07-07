import type { ScopeActionInput } from "../index";
import { buildContext } from "../context";

// A CUSTOM action (not a well-known scope action). Its slug is anything you
// like; declare name/type/retryable in defineScope since the SDK has no
// defaults for it. Custom actions are how you add package-specific operations.
export const sayHello = async (notification: ScopeActionInput, emit: (o: { stdout?: string }) => void) => {
  const ctx = buildContext(notification);
  const who = ctx.attributes.name || ctx.scopeSlug || ctx.scopeId;
  emit({ stdout: `Hello from ${ctx.scopeId}` });
  return { message: `Hello, ${who}!` };
};
