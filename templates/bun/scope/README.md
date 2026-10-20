# {{ .Name }}

A nullplatform scope: a place the platform deploys applications to.

| File | What it is |
| --- | --- |
| `src/schema.ts` | The scope's inputs and the outputs a deployment reports |
| `src/resources.ts` | The scope, its actions and their steps |
| `src/scope.ts` | `create-scope`, `delete-scope` |
| `src/deployment.ts` | The deployment actions |
| `src/logs.ts` | `log:read` |
| `test/` | One test per action |

```bash
mise run test
np package run                       # run it locally with a real agent
np package publish --nrn <account>   # register it
```
