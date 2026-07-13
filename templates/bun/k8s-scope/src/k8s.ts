// Thin wrapper over @kubernetes/client-node. In-cluster config when running as a
// worker pod; falls back to your kubeconfig for local dev.
import * as k8s from "@kubernetes/client-node";

export function k8sClients() {
  const kc = new k8s.KubeConfig();
  // In a pod KUBERNETES_SERVICE_HOST is always set → use the ServiceAccount.
  // Otherwise (local dev) use your kubeconfig.
  if (process.env.KUBERNETES_SERVICE_HOST) {
    kc.loadFromCluster();
  } else {
    kc.loadFromDefault();
  }
  return {
    core: kc.makeApiClient(k8s.CoreV1Api),
    apps: kc.makeApiClient(k8s.AppsV1Api),
  };
}
