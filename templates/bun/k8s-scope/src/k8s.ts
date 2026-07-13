// Thin wrapper over @kubernetes/client-node. In-cluster config when running as a
// worker pod; falls back to your kubeconfig for local dev.
import * as k8s from "@kubernetes/client-node";

export function k8sClients() {
  const kc = new k8s.KubeConfig();
  try {
    kc.loadFromCluster();
  } catch {
    kc.loadFromDefault();
  }
  return {
    core: kc.makeApiClient(k8s.CoreV1Api),
    apps: kc.makeApiClient(k8s.AppsV1Api),
  };
}
