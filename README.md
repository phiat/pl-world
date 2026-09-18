# PL World

An explorable museum of 50 programming languages, from Fortran (1957) to Zig (2016). It covers
where each language came from (lineage), what it is made of (traits as genes), and how it feels:
the same six programs side by side, all runnable on real toolchains in sandboxed containers.
See [DESIGN.md](DESIGN.md) for the full design.

## Run it locally

Requires Deno 2.x and Docker.

```sh
deno task images          # build/pull the sandbox images (once; add ids to limit, --rebuild to refresh)
deno task dev             # runner on 127.0.0.1:8787 + web app on http://127.0.0.1:8000
```

`deno task dev` runs both processes. To run them separately, use `deno task runner` and
`deno task web`. The web app works without the runner. Its Run buttons then report that the
runner is down.

## Pages

| Route | What it is |
| --- | --- |
| `/` | **River**: languages on a time × family chart with lineage links. Hover to trace ancestry, scrub or play the years, pick a concept (`?gene=closures`) to watch it spread. |
| `/lang/:id` | **Language page**: trait DNA, runnable snippets for each task, history, innovations, parents/children, closest languages by traits, milestones. |
| `/compare?l=c,lisp,apl&t=shapes` | **Rosetta Desk**: up to six period-skinned code windows, editable and runnable, plus a trait diff. |
| `/genome?sort=sim&to=rust` | **Genome**: a 50 × 55 language × concept matrix and convergent-evolution pairs. |

## Tasks

| Task | Does |
| --- | --- |
| `deno task validate` | Check `data/` against the zod schema, lineage and snippet rules |
| `deno task build:db` | Build `dist/world.json` and `dist/pl.db` (SQLite + FTS5); `web` runs this on start |
| `deno task runner` | The sandbox runner alone (`RUN_TIMEOUT_MS`, `PORT` env) |
| `deno task web` | The Fresh dev server alone |
| `deno task images [ids] [--rebuild] [--dry-run]` | Build `plw-*` images from `sandbox/<id>/Dockerfile`, pull the rest |
| `deno task verify [ids] [--task t] [--write]` | Run every snippet in the sandbox and compare with its expected output |
| `deno task test` | Runner unit and integration tests (needs Docker) |
| `cd web && deno task build && deno task start` | Production build served by `deno serve` |

## Layout

```
data/        source of truth: schema.ts (zod), languages/*.json, concepts.json, tasks.json
scripts/     validate.ts, build-db.ts
runner/      sandbox runner: sandbox.ts (docker plans, streaming), main.ts (HTTP/SSE), images.ts, verify.ts
sandbox/     Dockerfiles for toolchains without a usable public image (ALGOL 60, Simula, BCPL, B, CLU, …)
web/         Fresh 2 app: routes/ (SSR pages, /api/run proxy), islands/ (River, CodeWindow, DeskBar, …)
design/      the static prototype
```

## Sandbox

Each run gets a fresh container with `--network none`, 1 GB memory, 2 CPUs, 512 pids, all
capabilities dropped, `no-new-privileges`, tmpfs work dirs and a 90 s wall clock. Output is
capped at 64 KB. The runner listens on 127.0.0.1 only. This is enough for local use. A public
deployment would also need gVisor (`--runtime runsc`), a non-root user, a read-only root
filesystem and rate limits (see DESIGN.md §4).
