import pkg from "./package";

// `np package publish` reads the manifest from `--describe`. The SDK's manifest
// describes specifications (a scope or a service) and has no place for an
// execute() component yet, so a command handler prints its own: identity and
// agent routing. Everything else is the worker.
if (process.argv.includes("--describe")) {
  process.stdout.write(
    JSON.stringify({
      name: pkg.slug,
      version: pkg.version,
      description: pkg.description,
      command_types: ["custom"],
      agent: { selector: pkg.agent.selector, entrypoint: pkg.agent.entrypoint, sources: ["service"] },
    }),
  );
  process.exit(0);
}

pkg.start();
