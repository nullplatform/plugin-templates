import { configurationOf, resolveSource } from "@nullplatform/collector-kubernetes";
import { InMemoryIngest } from "@nullplatform/ingest/testing";
import { main, noopTracing, recordingPlatform, stderrLogger } from "@nullplatform/plugin";
import { kubernetesCollector } from "./collector";

// A local run: the cluster of the current kube context (K8S_CONTEXT names another) is read as a deployment reads its
// own, with the same K8S_* settings; nothing reaches catalog-ingest-api, the platform or the tracing API, and what each
// would get is told on stderr. Its source is `local`, unless NP_COLLECTOR_SOURCE_SLUG names another.
const environment = { NP_COLLECTOR_SOURCE_SLUG: "local", ...process.env };
const { config, ports } = configurationOf(environment);
const source = await resolveSource(environment, { log: stderrLogger });
await main(kubernetesCollector(config), {
  ...ports,
  source,
  ingest: new InMemoryIngest({ log: stderrLogger }),
  fetch: recordingPlatform({ log: stderrLogger }).fetch,
  tracing: noopTracing,
});
