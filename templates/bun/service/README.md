# {{ .Name }}

A nullplatform service: a dependency applications link to, such as a database or a queue.

| File | What it is |
| --- | --- |
| `src/schema.ts` | The service's inputs and outputs, and what a link exports |
| `src/resources.ts` | The service, its `connect` link, their actions and steps |
| `src/service.ts` | `create`, `update`, `delete` |
| `src/connect.ts` | The link's `create`, `update`, `delete` |
| `test/` | One test per action |

```bash
mise run test
np package run                       # run it locally with a real agent
np package publish --nrn <account>   # register it
```
