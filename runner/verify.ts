// Run every snippet through the sandbox and compare with its expected_output.
//   deno task verify                  # all languages, all tasks
//   deno task verify c rust           # some languages
//   deno task verify --task=hello     # one task
//   deno task verify --write          # set `verified` in data/languages/*.json from the results
import { parseArgs } from "@std/cli/parse-args";
import { loadWorld } from "../data/world.ts";
import { localImages, normalizeOutput, Sandbox, withTag } from "./sandbox.ts";

const args = parseArgs(Deno.args, { string: ["task", "concurrency"], boolean: ["write", "verbose"] });
const ids = args._.map(String);
const { languages } = await loadWorld({ ids });
const sandbox = new Sandbox(languages, args.concurrency ? { concurrency: Number(args.concurrency) } : {});
const have = await localImages();

type Row = { lang: string; task: string; ok: boolean; why?: string; ms?: number };
const jobs: Promise<Row>[] = [];
for (const l of languages) {
  if (ids.length && !ids.includes(l.id)) continue;
  // Languages that only run on their own platform (AppleScript on macOS) have nothing to verify here.
  if (!l.runtime.toolchains.some((t) => t.docker_image)) {
    console.log(`- ${l.id.padEnd(12)} no sandbox toolchain (${l.runtime.strategy}); snippets stay unverified`);
    continue;
  }
  for (const [task, s] of Object.entries(l.snippets)) {
    if (args.task && task !== args.task) continue;
    const image = sandbox.plan(l.id, s.code).image;
    if (!have.has(withTag(image))) {
      jobs.push(
        Promise.resolve({ lang: l.id, task, ok: false, why: `image ${image} missing (deno task images ${l.id})` }),
      );
      continue;
    }
    jobs.push(
      sandbox.run({ lang: l.id, code: s.code }).then((r) => {
        const ok = r.exit_code === 0 && normalizeOutput(r.stdout) === normalizeOutput(s.expected_output);
        const why = ok
          ? undefined
          : r.timed_out
          ? "timed out"
          : r.exit_code !== 0
          ? `exit ${r.exit_code} in ${r.failed_phase}: ${
            r.stderr.trim().split("\n").slice(-3).join(" ⏎ ").slice(0, 300)
          }`
          : `output differs:\n${indent("expected", s.expected_output)}\n${indent("actual", r.stdout)}`;
        const row: Row = { lang: l.id, task, ok, why, ms: r.total_ms };
        console.log(
          `${ok ? "✓" : "✗"} ${l.id.padEnd(12)} ${task.padEnd(13)} ${String(r.total_ms).padStart(6)} ms${
            ok ? "" : "  " + why
          }`,
        );
        return row;
      }),
    );
  }
}
const indent = (label: string, s: string) =>
  `      ${label}: ` + JSON.stringify(s.length > 400 ? s.slice(0, 400) + "…" : s);

const rows = await Promise.all(jobs);
const bad = rows.filter((r) => !r.ok);
for (const r of bad.filter((r) => r.ms === undefined)) {
  console.log(`✗ ${r.lang.padEnd(12)} ${r.task.padEnd(13)}  ${r.why}`);
}

// Slowest languages (sum of snippet times) — useful for tuning timeouts and warm images.
const byLang = new Map<string, number>();
for (const r of rows) if (r.ms) byLang.set(r.lang, (byLang.get(r.lang) ?? 0) + r.ms);
const slow = [...byLang].sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log(`\nslowest: ${slow.map(([l, ms]) => `${l} ${(ms / 1000).toFixed(1)}s`).join(" · ")}`);
console.log(`${rows.length - bad.length}/${rows.length} snippets pass`);

if (args.write) {
  const results = new Map(rows.map((r) => [`${r.lang}/${r.task}`, r.ok]));
  for (const l of languages) {
    const path = new URL(`../data/languages/${l.id}.json`, import.meta.url);
    const raw = JSON.parse(await Deno.readTextFile(path));
    let changed = false;
    for (const [task, s] of Object.entries(raw.snippets as Record<string, { verified: boolean }>)) {
      const ok = results.get(`${l.id}/${task}`);
      if (ok !== undefined && s.verified !== ok) {
        s.verified = ok;
        changed = true;
      }
    }
    if (changed) await Deno.writeTextFile(path, JSON.stringify(raw, null, 2) + "\n");
  }
  console.log("updated `verified` flags");
}
Deno.exit(bad.length ? 1 : 0);
