/**
 * What this package publishes: the {{ .Name }} service and its `connect`
 * link, each with the handlers of its actions and their plans. Every field is
 * one of the service API's own (`useDefaultActions`, `assignableTo`, …) in
 * camelCase; the schemas are the ones the platform renders, verbatim.
 */

import { link, service } from "@nullplatform/plugin/package";
import * as connection from "./connect";
import { linkSchema, serviceSchema, serviceUiSchema } from "./schema";
import * as svcActions from "./service";

/** One stage per action is enough for a dependency; the console shows each run's steps under it. */
const plan = (title: string, description: string, stage: { key: string; title: string }, steps: Array<{ key: string; title: string }>) => ({
  title,
  description,
  groups: [stage],
  steps: steps.map((s) => ({ ...s, group: stage.key })),
});

export const servicePlans = {
  create: plan("Create {{ .Name }}", "Provision the dependency and report where it listens.", { key: "provision", title: "Provision" }, [
    { key: "provision", title: "Provision the dependency" },
  ]),
  update: plan("Update {{ .Name }}", "Apply the changed inputs.", { key: "update", title: "Update" }, [{ key: "resize", title: "Resize" }]),
  delete: plan("Delete {{ .Name }}", "Remove the dependency.", { key: "delete", title: "Delete" }, [
    { key: "deprovision", title: "Delete the dependency" },
  ]),
};

export const linkPlans = {
  create: plan("Connect", "Give the application its own access.", { key: "access", title: "Access" }, [{ key: "grant access", title: "Grant access" }]),
  delete: plan("Disconnect", "Revoke the application's access.", { key: "access", title: "Access" }, [{ key: "revoke access", title: "Revoke access" }]),
};

export const svc = service({
  slug: "{{ .Slug }}",
  name: "{{ .Name }}",
  // Edit: how the catalog groups this service, e.g.
  // { category: "Database", provider: "AWS", subCategory: "Relational Database" }.
  selectors: { category: "Custom", provider: "Custom" },
  attributes: { schema: serviceSchema },
  uiSchema: serviceUiSchema,
  plans: servicePlans,
  actions: { create: svcActions.create, update: svcActions.update, delete: svcActions.remove },
});

export const connect = link(svc, {
  slug: "connect",
  name: "Connect",
  attributes: { schema: linkSchema },
  plans: linkPlans,
  actions: { create: connection.create, update: connection.update, delete: connection.remove },
});
