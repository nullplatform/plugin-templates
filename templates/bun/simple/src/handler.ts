import { ActionError, type ExecuteContext } from "@nullplatform/plugin/package";

interface Command {
  action?: string;
  name?: string;
}

export async function handle({ payload }: ExecuteContext) {
  const { action, name = "world" } = payload as Command;

  switch (action) {
    case "hello":
      return { message: `Hello, ${name}!` };
    default:
      throw new ActionError("UNKNOWN_ACTION", `Unknown action: ${action}`);
  }
}
