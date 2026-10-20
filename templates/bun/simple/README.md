# {{ .Name }}

A nullplatform command handler: it answers the documents sent to it and returns the result in the same response.

| File | What it is |
| --- | --- |
| `src/handler.ts` | One case per action |
| `test/` | One test per action |

```bash
mise run test
np package run                       # run it locally with a real agent
np package publish --nrn <account>   # register it
```
