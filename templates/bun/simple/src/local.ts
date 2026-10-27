import { main, noopTracing, recordingPlatform, stderrLogger } from "@nullplatform/plugin";
import plugin from "./plugin";

// A local run: nothing reaches the platform or the tracing API; each request the platform would get is told on stderr.
await main(plugin, { fetch: recordingPlatform({ log: stderrLogger }).fetch, tracing: noopTracing });
