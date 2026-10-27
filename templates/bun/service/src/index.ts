import { main } from "@nullplatform/plugin";
import service from "./service";

// What the agent runs: the real ports (the platform API, the tracing API), the settings the agent sets on the worker.
await main(service);
