/**
 * nullplatform's Kubernetes collector, as this package: the library's
 * collector (`@nullplatform/collector-kubernetes`), built from its
 * configuration, under the package package.json declares, with the extension
 * this package adds to it (none unless `EXTENSION` names one: see
 * extension.ts). Nothing runs on import: the entry points (index.ts, local.ts)
 * say what it is configured with.
 *
 * What its records become is nullplatform's: the `k8s-*` catalog
 * specifications, the `kubernetes` source type and its mappings, which a
 * publish pins as they are; the organization's own is where each mapping is
 * written (a destination), which the publish binds.
 */

import { collectorDefinition, type CollectorDeps, type KubernetesOptions } from "@nullplatform/collector-kubernetes";
import { defineCollector } from "@nullplatform/plugin/collector";
import manifest from "../package.json" with { type: "json" };
import { extended, NO_EXTENSION, type Extension } from "./extension";

/** The extension the package publishes and runs: none. `namespaceOwners` (extension.ts) is one, ready to switch on. */
export const EXTENSION: Extension = NO_EXTENSION;

/** What a collector is built with beside its configuration: how it reaches the cluster (a test's fake) and the extension it runs. */
export interface CollectorOptions {
  deps?: CollectorDeps;
  extension?: Extension;
}

/** The Kubernetes collector of `config` (each part the library's default unless given), extended. */
export function kubernetesCollector(config: KubernetesOptions = {}, options: CollectorOptions = {}) {
  return defineCollector({
    ...extended(collectorDefinition(config, options.deps), options.extension ?? EXTENSION),
    // The package, as package.json declares it: baked in at build time. The source is the cluster's, never the package's (index.ts).
    package: { name: manifest.name, version: manifest.version, description: manifest.description },
  });
}
