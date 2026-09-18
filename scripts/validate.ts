// Validate language data.
//   deno run -A scripts/validate.ts            # all languages + cross-reference report
//   deno run -A scripts/validate.ts c rust     # just these ids
import { Concept, Language, LANGUAGE_IDS, Task } from "../data/schema.ts";
import conceptsJson from "../data/concepts.json" with { type: "json" };
import tasksJson from "../data/tasks.json" with { type: "json" };

const dataDir = new URL("../data/", import.meta.url);
const errors: string[] = [];
const warnings: string[] = [];

const concepts = Concept.array().parse(conceptsJson);
const tasks = Task.array().parse(tasksJson);
const norm = (s: string) => s.replace(/[ \t]+$/gm, "").trimEnd();

const requested = Deno.args.length ? Deno.args : [...LANGUAGE_IDS];
const langs = new Map<string, Language>();

for (const id of requested) {
  const path = new URL(`languages/${id}.json`, dataDir);
  let raw: unknown;
  try {
    raw = JSON.parse(await Deno.readTextFile(path));
  } catch (e) {
    (Deno.args.length ? errors : warnings).push(`${id}: ${e instanceof Deno.errors.NotFound ? "missing file" : e}`);
    continue;
  }
  const res = Language.safeParse(raw);
  if (!res.success) {
    for (const issue of res.error.issues) errors.push(`${id}: ${issue.path.join(".")}: ${issue.message}`);
    continue;
  }
  const lang = res.data;
  langs.set(id, lang);
  const e = (m: string) => errors.push(`${id}: ${m}`);
  const w = (m: string) => warnings.push(`${id}: ${m}`);

  if (lang.id !== id) e(`id "${lang.id}" does not match filename`);
  for (const t of tasks) {
    const s = lang.snippets[t.id];
    if (!s) {
      e(`missing snippet "${t.id}"`);
      continue;
    }
    if (t.expected_output !== null && norm(s.expected_output) !== norm(t.expected_output)) {
      e(`snippet "${t.id}" expected_output differs from task spec`);
    }
    if (t.id === "signature" && !s.title) e(`signature snippet needs a title`);
    if (!s.code.trim()) e(`snippet "${t.id}" has empty code`);
  }
  const parents = new Set(lang.influenced_by.map((l) => l.id));
  if (parents.has(lang.id)) e(`influenced_by contains itself`);
  if (lang.influenced.includes(lang.id)) e(`influenced contains itself`);
  if (lang.primary_parent && !parents.has(lang.primary_parent)) {
    e(`primary_parent "${lang.primary_parent}" not in influenced_by`);
  }
  if (parents.size !== lang.influenced_by.length) e(`duplicate ids in influenced_by`);
  for (let i = 1; i < lang.milestones.length; i++) {
    if (lang.milestones[i].year < lang.milestones[i - 1].year) {
      w(`milestones not sorted by year`);
      break;
    }
  }
  if (!lang.color) w(`no color`);
  if (lang.runtime.strategy !== "unavailable" && lang.runtime.toolchains.length === 0) e(`runtime has no toolchains`);
  if (Object.keys(lang.traits).length < 3) {
    w(`only ${Object.keys(lang.traits).length} traits — check all ${concepts.length} concepts were considered`);
  }
}

// Cross-reference report (only meaningful once many languages exist).
const info: string[] = [];
if (!Deno.args.length && langs.size > 1) {
  const byId = (id: string) => langs.get(id);
  for (const lang of langs.values()) {
    for (const p of lang.influenced_by) {
      const parent = byId(p.id);
      if (parent && parent.year > lang.year) {
        info.push(
          `${p.id} (${parent.year}) → ${lang.id} (${lang.year}) is cross-pollination (later language fed back into a newer version)`,
        );
      }
      if (parent && !parent.influenced.includes(lang.id)) info.push(`${p.id} → ${lang.id} only declared by child`);
    }
    for (const c of lang.influenced) {
      const child = byId(c);
      if (child && !child.influenced_by.some((l) => l.id === lang.id)) {
        info.push(`${lang.id} → ${c} only declared by parent`);
      }
    }
  }
  for (const c of concepts) {
    if (c.origin.lang) {
      const o = byId(c.origin.lang);
      if (o && !o.traits[c.id]) warnings.push(`concept ${c.id}: origin ${c.origin.lang} lacks the trait`);
    }
    for (const p of c.popularized_by) {
      const l = byId(p);
      if (l && !l.traits[c.id]) warnings.push(`concept ${c.id}: popularizer ${p} lacks the trait`);
    }
  }
}

const print = (label: string, xs: string[]) =>
  xs.length && console.log(`\n${label} (${xs.length})\n  ` + xs.join("\n  "));
print("ERRORS", errors);
print("WARNINGS", warnings);
print("LINEAGE NOTES (reconciled at build time)", info);
console.log(
  `\n${langs.size}/${requested.length} valid-shaped language files, ${errors.length} errors, ${warnings.length} warnings`,
);
Deno.exit(errors.length ? 1 : 0);
