/**
 * The command handler: the platform (or a UI plugin, or a workflow) sends a
 * document through the agent — `POST /controlplane/agent_command` with
 * `{ type: "package-exec", data: { package: "{{ .Slug }}", environment: { NP_ACTION_CONTEXT: <document> } } }`
 * — and `execute()` answers it. What the handler returns is the answer, in
 * the same response: this is the way to serve reads (list, get) with live data.
 *
 * The document's shape is yours. This one dispatches on `action`, the way the
 * S3 browser package does (`list-objects`, `head-object`, …).
 */

import { ActionError, type ExecuteContext } from "@nullplatform/plugin/package";

export interface Command {
  action: string;
  [field: string]: unknown;
}

/** The command out of the document: flat, or under `command` next to the platform's `notification`. */
export function commandOf(payload: unknown): Command {
  const outer = (payload ?? {}) as Record<string, unknown>;
  const body = (outer.command && typeof outer.command === "object" ? outer.command : outer) as Record<string, unknown>;
  if (typeof body.action !== "string" || !body.action) throw new ActionError("BAD_REQUEST", "the document carries no action");
  return body as Command;
}

export async function handle(ctx: ExecuteContext): Promise<unknown> {
  const command = commandOf(ctx.payload);
  switch (command.action) {
    case "hello":
      return ctx.step("say hello", async (step) => {
        const name = typeof command.name === "string" && command.name ? command.name : "world";
        step.explain({ what: `Said hello to ${name}.` });
        return { message: `Hello ${name}, from {{ .Name }}` };
      });
    // Replace / add: one case per action this package answers.
    default:
      throw new ActionError("UNKNOWN_ACTION", `unknown action ${JSON.stringify(command.action)}`);
  }
}
