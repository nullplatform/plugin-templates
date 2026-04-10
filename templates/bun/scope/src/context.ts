/**
 * Builds typed context from action input.
 *
 * Overloaded: scope actions get ScopeContext, deployment actions get DeploymentContext.
 */

import type { ScopeActionInput, DeploymentActionInput, ScopeAttributes } from "./index";

export interface ScopeContext {
  scopeId: string;
  scopeSlug: string;
  attributes: ScopeAttributes;
}

export interface DeploymentContext extends ScopeContext {
  deploymentId: string;
  image: string;
  weight: number;
}

export function buildContext(input: ScopeActionInput): ScopeContext;
export function buildContext(input: DeploymentActionInput): DeploymentContext;
export function buildContext(input: ScopeActionInput | DeploymentActionInput): ScopeContext | DeploymentContext {
  const attrs = (input.service?.attributes ?? {}) as ScopeAttributes;
  const params = input.parameters;
  const tags = input.tags ?? {};

  const base: ScopeContext = {
    scopeId: String(params.scope_id ?? ""),
    scopeSlug: input.service?.slug ?? (tags as any).scope ?? "",
    attributes: attrs,
  };

  if ("deployment_id" in params) {
    return {
      ...base,
      deploymentId: String(params.deployment_id),
      image: (attrs as any).asset_url ?? "",
      weight: Number((params as any).weight ?? 100),
    } satisfies DeploymentContext;
  }

  return base;
}
