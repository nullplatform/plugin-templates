import { main, noopTracing, recordingPlatform, stderrLogger } from "@nullplatform/plugin";
import scope from "./scope";

// A local run: nothing reaches the platform or the tracing API; each request the platform would get is told on stderr.
await main(scope, { fetch: recordingPlatform({ log: stderrLogger }).fetch, tracing: noopTracing });
