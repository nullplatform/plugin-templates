import { configurationOf, resolveSource } from "@nullplatform/collector-kubernetes";
import { main, stderrLogger } from "@nullplatform/plugin";
import { kubernetesCollector } from "./collector";

// What the image runs: the real ports (catalog-ingest-api with the platform API key, the platform API, the tracing API).
// --describe prints what `np package publish` reads: every record type's definitions, whatever K8S_* narrows a
// deployment to, so one publish binds what every cluster of the organization may send; it asks the cluster nothing.
// Otherwise its settings are the deployment's environment (README.md, Settings): one snapshot with
// NP_ACTION_CONTEXT='{}', else served (a snapshot every interval, plus the watch) until SIGTERM.
try {
  if (process.argv.includes("--describe")) {
    await main(kubernetesCollector());
  } else {
    const { config, ports } = configurationOf(process.env);
    // One source per cluster: NP_COLLECTOR_SOURCE_SLUG, else the cluster's own name, else its kube-system uid.
    const source = await resolveSource(process.env, { log: stderrLogger });
    await main(kubernetesCollector(config), { ...ports, source });
  }
} catch (error) {
  // A setting the library refuses (K8S_EVENT_TYPES=…), or a cluster it cannot ask its name: said, never a stack.
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
