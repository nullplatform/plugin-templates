# plugin-templates

The templates are the project side of `@nullplatform/plugin`: the library
defines, the project runs. A template's `src/index.ts` owns argv (parsed with
`parseArgs` from `node:util`), signals, stdout and the exit code; the library
reads none of them.

## Local runs are the entry point's
Owner: "libraries should not be aware of environments". The SDK reports to the
platform, the tracing API and catalog-ingest-api as its settings say. A
template's `src/index.ts` reads `NP_MODE` (set by `np package dev` and
`np package test`) and then passes the ports that keep the run local:
`new InMemoryPlatformClient()` and `{ ...plugin, tracing: noopTracing }`. A
test that spawns the worker says `NP_MODE: "test"` itself.

## Code style
- Every `if`, `else if` and `else` body is a block in braces on its own lines,
  even a one-line `return` or `throw` (owner: "I really hate if/else with no
  curly {} is hard to read that there is a condifional there, should be always
  if (...) { ...block }").
- Meaningful names, never single letters. Small functions, early returns.
