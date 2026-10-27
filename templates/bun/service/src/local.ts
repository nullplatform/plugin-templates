import { main, noopTracing, recordingPlatform, stderrLogger } from "@nullplatform/plugin";
import service from "./service";

// A local run: nothing reaches the platform or the tracing API; each request the platform would get is told on stderr.
await main(service, { fetch: recordingPlatform({ log: stderrLogger }).fetch, tracing: noopTracing });
