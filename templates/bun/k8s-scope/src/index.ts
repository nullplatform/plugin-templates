import { defineScope } from "@nullplatform/plugin/scope";
import { k8sClients } from "./k8s";

// A scope package that deploys to Kubernetes with the TypeScript client. Creating
// a scope of this type provisions a namespace + a Deployment; deleting it tears
// them down. Swap the body for whatever your infrastructure actually is.
defineScope({
  name: "{{ .Slug }}",
  version: "0.1.0",
  category: "{{ .Category }}",
  provider: "{{ .Provider }}",
  schema: {
    type: "object",
    properties: {
      image: { type: "string", default: "nginx:alpine", visibleOn: ["create", "update"] },
      replicas: { type: "number", default: 1, visibleOn: ["create", "update"] },
    },
  },
  actions: {
    "create-scope": {
      input: { type: "object" },
      handler: async (n, emit) => {
        const { core, apps } = k8sClients();
        const ns = `scope-${n.service?.slug ?? n.service?.id ?? "{{ .Slug }}"}`;
        const attrs = (n.service?.attributes ?? {}) as { image?: string; replicas?: number };
        const image = attrs.image ?? "nginx:alpine";
        const replicas = Number(attrs.replicas ?? 1);

        emit({ stdout: `creating namespace ${ns}` });
        await core.createNamespace({ body: { metadata: { name: ns } } }).catch(ignoreConflict);

        emit({ stdout: `deploying ${image} (${replicas} replica${replicas === 1 ? "" : "s"}) in ${ns}` });
        await apps.createNamespacedDeployment({
          namespace: ns,
          body: {
            metadata: { name: "app", labels: { app: "app" } },
            spec: {
              replicas,
              selector: { matchLabels: { app: "app" } },
              template: {
                metadata: { labels: { app: "app" } },
                spec: { containers: [{ name: "app", image }] },
              },
            },
          },
        }).catch(ignoreConflict);

        return { message: `scope deployed to namespace ${ns}`, namespace: ns };
      },
    },
    "delete-scope": {
      input: { type: "object" },
      handler: async (n, emit) => {
        const { core } = k8sClients();
        const ns = `scope-${n.service?.slug ?? n.service?.id ?? "{{ .Slug }}"}`;
        emit({ stdout: `deleting namespace ${ns}` });
        await core.deleteNamespace({ name: ns }).catch(() => {});
        return { message: `namespace ${ns} deleted` };
      },
    },
  },
});

// createX throws on 409 (already exists) — make create idempotent.
function ignoreConflict(err: any) {
  const code = err?.code ?? err?.statusCode ?? err?.response?.statusCode;
  if (code === 409) return;
  throw err;
}
