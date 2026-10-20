import { link, service } from "@nullplatform/plugin/package";
import * as connection from "./connect";
import { linkSchema, serviceSchema, serviceUiSchema } from "./schema";
import * as actions from "./service";

export const svc = service({
  slug: "{{ .Slug }}",
  name: "{{ .Name }}",
  selectors: { category: "Custom", provider: "Custom" },
  attributes: { schema: serviceSchema },
  uiSchema: serviceUiSchema,
  plans: {
    create: ["provision"],
    update: ["resize"],
    delete: ["deprovision"],
  },
  actions: { create: actions.create, update: actions.update, delete: actions.remove },
});

export const connect = link(svc, {
  slug: "connect",
  name: "Connect",
  attributes: { schema: linkSchema },
  plans: {
    create: ["grant access"],
    delete: ["revoke access"],
  },
  actions: { create: connection.create, update: connection.update, delete: connection.remove },
});
