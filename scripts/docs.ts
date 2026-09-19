// Keep the counts quoted in the Markdown docs in step with the data. Each one is wrapped in HTML comments,
// e.g. <!--languages-->68<!--/-->, which GitHub doesn't render; this script rewrites what sits between them.
//   deno run -A scripts/docs.ts            # rewrite stale counts (build:db runs this)
//   deno run -A scripts/docs.ts --check    # exit 1 if any count is stale (CI)
import { loadWorld } from "../data/world.ts";
import type { Language } from "../data/schema.ts";

const root = new URL("../", import.meta.url);
const DOCS = ["README.md", "DESIGN.md", "data/README.md"];
/** Docs kept in `deno fmt` style: a count that changes width can misalign their tables. */
const FORMATTED = ["README.md", "DESIGN.md"];
const check = Deno.args.includes("--check");

const { languages, concepts, tasks, edges } = await loadWorld();
const byYear = languages.toSorted((a, b) => a.year - b.year);
const at = (l: Language) => `${l.name} (${l.year})`;
const snippets = (ls: Language[]) => ls.flatMap((l) => Object.values(l.snippets));
// Same rule as sandboxToolchain() in web/lib/world.ts: runnable means the sandbox has a Docker image for it.
const runnable = languages.filter((l) => l.runtime.toolchains.some((t) => t.docker_image));
let images = 0;
for await (const d of Deno.readDir(new URL("sandbox/", root))) {
  if (d.isDirectory && await Deno.stat(new URL(`sandbox/${d.name}/Dockerfile`, root)).catch(() => null)) images++;
}

const VALUES: Record<string, string | number> = {
  languages: languages.length,
  concepts: concepts.length,
  tasks: tasks.length,
  span: `${at(byYear[0])} to ${at(byYear.at(-1)!)}`,
  edges: edges.length,
  "cross-pollination": edges.filter((e) => e.retro).length,
  "forward-edges": edges.filter((e) => !e.retro).length,
  snippets: snippets(languages).length,
  runnable: snippets(runnable).length,
  verified: snippets(languages).filter((s) => s.verified).length,
  tagged: snippets(languages).filter((s) => s.concepts.length).length,
  images,
};

const stale: string[] = [];
const broken: string[] = [];
const changed = new Map<string, string>();
for (const doc of DOCS) {
  const path = new URL(doc, root);
  const text = await Deno.readTextFile(path);
  let seen = 0;
  // A marked value may be wrapped over lines by `deno fmt`, so compare it with whitespace collapsed.
  const next = text.replace(/<!--([\w-]+)-->([^<]*)<!--\/-->/g, (m, key: string, old: string) => {
    seen++;
    if (!(key in VALUES)) {
      broken.push(`${doc}: unknown <!--${key}--> (known: ${Object.keys(VALUES).join(", ")})`);
      return m;
    }
    const value = String(VALUES[key]);
    if (old.replace(/\s+/g, " ") === value) return m;
    stale.push(`${doc}: ${key} ${old.replace(/\s+/g, " ")} → ${value}`);
    return `<!--${key}-->${value}<!--/-->`;
  });
  const opened = text.match(/<!--[\w-]+-->/g)?.length ?? 0;
  if (opened !== seen) broken.push(`${doc}: ${opened - seen} marker(s) without a matching <!--/-->`);
  if (next !== text) changed.set(doc, next);
}

if (broken.length) {
  console.error(`Broken count markers:\n  ${broken.join("\n  ")}`);
  Deno.exit(1);
}
if (check) {
  if (stale.length) {
    console.error(`Stale counts in the docs; run \`deno task docs\`:\n  ${stale.join("\n  ")}`);
    Deno.exit(1);
  }
  console.log("Docs quote current counts.");
} else if (changed.size) {
  for (const [doc, text] of changed) await Deno.writeTextFile(new URL(doc, root), text);
  const fmt = [...changed.keys()].filter((d) => FORMATTED.includes(d));
  if (fmt.length) await new Deno.Command(Deno.execPath(), { args: ["fmt", "-q", ...fmt], cwd: root }).output();
  console.log(`Updated counts in the docs:\n  ${stale.join("\n  ")}`);
}
