/**
 * How each action reads on the console's timeline: its title, what it does,
 * and its plan — the steps it runs, under one stage. A step's key is the
 * exact name its handler gives `context.trace.step`. None of it is
 * published: it is the run's, on the trace.
 */

import type { Plan } from "@nullplatform/plugin";

interface PlannedStep {
  key: string;
  title: string;
}

/** An action's narration on the trace: its title, its description and its plan. */
interface Narration {
  title: string;
  description: string;
  plan: Plan & { steps: PlannedStep[] };
}

/** One stage per action is enough for a dependency; the console shows each run's steps under it. */
const narrated = (title: string, description: string, stage: { key: string; title: string }, steps: PlannedStep[]): Narration => ({
  title,
  description,
  plan: { groups: [stage], steps: steps.map((step) => ({ ...step, group: stage.key })) },
});

export const serviceNarration = {
  create: narrated("Create {{ .Name }}", "Provision the dependency and report where it listens.", { key: "provision", title: "Provision" }, [
    { key: "provision", title: "Provision the dependency" },
  ]),
  update: narrated("Update {{ .Name }}", "Apply the changed inputs.", { key: "update", title: "Update" }, [{ key: "resize", title: "Resize" }]),
  delete: narrated("Delete {{ .Name }}", "Remove the dependency.", { key: "delete", title: "Delete" }, [{ key: "deprovision", title: "Delete the dependency" }]),
};

export const connectNarration = {
  create: narrated("Connect", "Give the application its own access.", { key: "access", title: "Access" }, [{ key: "grant-access", title: "Grant access" }]),
  delete: narrated("Disconnect", "Revoke the application's access.", { key: "access", title: "Access" }, [{ key: "revoke-access", title: "Revoke access" }]),
};
