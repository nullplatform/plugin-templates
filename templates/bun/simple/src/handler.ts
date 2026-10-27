/**
 * The command handler: the platform (or a UI plugin, or a workflow) sends a
 * document through the agent — `POST /controlplane/agent_command` with
 * `{ type: "package-exec", data: { package: "{{ .Slug }}", environment: { NP_ACTION_CONTEXT: <document> } } }`
 * — and `execute()` hands it over as the payload. What the handler returns is
 * the answer, in the same response: this is the way to serve reads (list,
 * get) with live data.
 *
 * The document's shape is yours. This one dispatches on `action`, the way the
 * S3 browser package does (`list-objects`, `head-object`, …). A document that
 * wraps it, `{ notification: { action, … } }`, hands over what it wraps.
 */

import { ActionError, type Context, type Payload } from "@nullplatform/plugin";

export interface Command {
  action: string;
  [field: string]: unknown;
}

/** The command the payload is: refused unless it names an action. */
export function commandOf(payload: Payload): Command {
  if (typeof payload.action !== "string" || !payload.action) {
    throw new ActionError("BAD_REQUEST", "the document carries no action");
  }
  return payload as Command;
}

export async function handle(payload: Payload, context: Context): Promise<unknown> {
  const command = commandOf(payload);
  switch (command.action) {
    case "hello":
      return context.trace.step("say-hello", async (step) => {
        const name = typeof command.name === "string" && command.name ? command.name : "world";
        step.explain({ what: `Said hello to ${name}.` });
        return { message: `Hello ${name}, from {{ .Name }}` };
      });
    // Replace / add: one case per action this package answers.
    default:
      throw new ActionError("UNKNOWN_ACTION", `unknown action ${JSON.stringify(command.action)}`);
  }
}
