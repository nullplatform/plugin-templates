import { definePackage, execute } from "@nullplatform/plugin/package";
import { Tracer } from "@nullplatform/tracing";
import manifest from "../package.json" with { type: "json" };
import { handle } from "./handler";

/**
 * The platform's trace, continued. The tracer is built here, with a static
 * import, because the SDK's own lazy import cannot be resolved inside a
 * `bun build --compile` binary. Off when the agent passes no NP_TRACING_URL.
 */
type Tracing = NonNullable<Parameters<typeof definePackage>[0]["tracing"]>;
const tracing = process.env.NP_TRACING_URL
  ? (new Tracer({
      baseURL: process.env.NP_TRACING_URL,
      apiKey: process.env.NP_API_KEY ?? "",
      producer: manifest.name,
    }) as unknown as Tracing)
  : undefined;

export default definePackage({
  // Baked in at build time from package.json, so the compiled worker knows who it is wherever it runs.
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  // execute() answers any document the agent hands over that names none of
  // the package's specifications: here, every command.
  components: [execute(handle)],
  ...(tracing ? { tracing } : {}),
});
