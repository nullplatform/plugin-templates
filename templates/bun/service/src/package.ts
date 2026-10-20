import { definePackage } from "@nullplatform/plugin/package";
import { Tracer } from "@nullplatform/tracing";
import manifest from "../package.json" with { type: "json" };
import { connect, svc } from "./resources";

/**
 * The platform's trace, continued: one run per action, one step per ctx.step.
 * The tracer is built here, with a static import, because the SDK's own lazy
 * import cannot be resolved inside a `bun build --compile` binary. Off when
 * the agent passes no NP_TRACING_URL.
 */
type Tracing = NonNullable<Parameters<typeof definePackage>[0]["tracing"]>;
const tracing = process.env.NP_TRACING_URL
  ? (new Tracer({
      baseURL: process.env.NP_TRACING_URL,
      apiKey: process.env.NP_API_KEY ?? "",
      producer: manifest.name,
    }) as unknown as Tracing) // the SDK's client type is narrower than the Tracer's overloads
  : undefined;

export default definePackage({
  // Baked in at build time from package.json, so the compiled worker knows who it is wherever it runs.
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  components: [svc, connect],
  ...(tracing ? { tracing } : {}),
});
