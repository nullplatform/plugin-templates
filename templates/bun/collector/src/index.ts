import { defineCollector } from "@nullplatform/plugin/collector";
import { collector } from "./collector";

// The SDK decides how to run from the command line and environment:
//   --describe   print the manifest
//   --once       one snapshot, then exit (a cron job)
//   --run        a snapshot every interval, plus the watch (a long-running container)
//   NP_AGENT_PLUGIN / NP_ACTION_CONTEXT   as a worker the nullplatform agent drives
defineCollector(collector);
