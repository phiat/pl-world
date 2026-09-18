# PL World — web

The Fresh 2 app (Vite, Preact islands). Run it from the project root with `deno task dev`
(runner + web) or `deno task web`. See the root [README](../README.md).

- `lib/world.ts` loads `../dist/world.json` (server only) and computes lineage and trait similarity.
- `lib/meta.ts` holds client-safe constants (families, categories, eras).
- `routes/api/run.ts` proxies runs to the sandbox runner (`RUNNER_URL`, default `http://127.0.0.1:8787`).
