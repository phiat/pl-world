// Compile data/*.json into dist/pl.db (SQLite, for queries + full-text search)
// and dist/world.json (one denormalized bundle with reconciled lineage, for the app).
//   deno run -A scripts/build-db.ts
import { DatabaseSync } from "node:sqlite";
import { loadWorld } from "../data/world.ts";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
await Deno.mkdir(dist, { recursive: true });

const world = await loadWorld({ onSkip: (id) => console.warn(`skip ${id}: missing`) });
const { languages, concepts, tasks } = world;
const present = new Set(languages.map((l) => l.id));

const dbPath = new URL("pl.db", dist);
await Deno.remove(dbPath).catch(() => {});
const db = new DatabaseSync(dbPath.pathname);
db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE languages (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, year INTEGER NOT NULL, year_note TEXT,
  organization TEXT, country TEXT, tagline TEXT, summary TEXT, history TEXT,
  family TEXT, syntax_family TEXT, block_style TEXT,
  typing_discipline TEXT, typing_strength TEXT, typing_inference TEXT, typing_equivalence TEXT, typing_notes TEXT,
  memory TEXT, memory_note TEXT, status TEXT, latest_version TEXT, color TEXT,
  primary_parent TEXT REFERENCES languages(id) DEFERRABLE INITIALLY DEFERRED,
  runtime_strategy TEXT, wikipedia TEXT, homepage TEXT
);
CREATE TABLE designers   (lang TEXT REFERENCES languages(id), ord INTEGER, name TEXT);
CREATE TABLE aliases     (lang TEXT REFERENCES languages(id), alias TEXT);
CREATE TABLE paradigms   (lang TEXT REFERENCES languages(id), paradigm TEXT);
CREATE TABLE execution   (lang TEXT REFERENCES languages(id), mode TEXT);
CREATE TABLE innovations (lang TEXT REFERENCES languages(id), ord INTEGER, text TEXT);
CREATE TABLE lineage (
  parent TEXT REFERENCES languages(id), child TEXT REFERENCES languages(id),
  kind TEXT, weight TEXT, note TEXT, declared_by TEXT, retro INTEGER, PRIMARY KEY (parent, child)
);
CREATE TABLE external_influences (lang TEXT REFERENCES languages(id), name TEXT, year INTEGER, note TEXT);
CREATE TABLE concepts (
  id TEXT PRIMARY KEY, name TEXT, category TEXT, summary TEXT,
  origin_lang TEXT, origin_external TEXT, origin_year INTEGER, origin_note TEXT
);
CREATE TABLE concept_popularizers (concept TEXT REFERENCES concepts(id), lang TEXT);
CREATE TABLE traits (
  lang TEXT REFERENCES languages(id), concept TEXT REFERENCES concepts(id),
  level TEXT, since INTEGER, version TEXT, note TEXT, PRIMARY KEY (lang, concept)
);
CREATE TABLE tasks (id TEXT PRIMARY KEY, name TEXT, prompt TEXT, shows TEXT, expected_output TEXT);
CREATE TABLE snippets (
  lang TEXT REFERENCES languages(id), task TEXT REFERENCES tasks(id),
  title TEXT, dialect TEXT, code TEXT, expected_output TEXT, notes TEXT, verified INTEGER,
  PRIMARY KEY (lang, task)
);
CREATE TABLE snippet_concepts (
  lang TEXT, task TEXT, concept TEXT REFERENCES concepts(id),
  PRIMARY KEY (lang, task, concept), FOREIGN KEY (lang, task) REFERENCES snippets(lang, task)
);
CREATE TABLE milestones (lang TEXT REFERENCES languages(id), year INTEGER, event TEXT);
CREATE TABLE toolchains (
  lang TEXT REFERENCES languages(id), ord INTEGER, name TEXT, version TEXT,
  docker_image TEXT, install TEXT, dockerfile TEXT, compile TEXT, run TEXT, notes TEXT
);
CREATE VIRTUAL TABLE search USING fts5(lang UNINDEXED, name, aliases, tagline, summary, history, innovations);
`);

const ins = (table: string, row: Record<string, unknown>) => {
  const cols = Object.keys(row);
  db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`)
    .run(...cols.map((c) => (row[c] === undefined ? null : row[c] as never)));
};

db.exec("BEGIN");
for (const c of concepts) {
  ins("concepts", {
    id: c.id,
    name: c.name,
    category: c.category,
    summary: c.summary,
    origin_lang: c.origin.lang,
    origin_external: c.origin.external,
    origin_year: c.origin.year,
    origin_note: c.origin.note,
  });
  for (const p of c.popularized_by) ins("concept_popularizers", { concept: c.id, lang: p });
}
for (const t of tasks) ins("tasks", { ...t });
for (const l of languages) {
  ins("languages", {
    id: l.id,
    name: l.name,
    year: l.year,
    year_note: l.year_note,
    organization: l.organization,
    country: l.country,
    tagline: l.tagline,
    summary: l.summary,
    history: l.history,
    family: l.family,
    syntax_family: l.syntax_family,
    block_style: l.block_style,
    typing_discipline: l.typing.discipline,
    typing_strength: l.typing.strength,
    typing_inference: l.typing.inference,
    typing_equivalence: l.typing.equivalence,
    typing_notes: l.typing.notes,
    memory: l.memory,
    memory_note: l.memory_note,
    status: l.status,
    latest_version: l.latest_version,
    color: l.color,
    primary_parent: l.primary_parent && present.has(l.primary_parent) ? l.primary_parent : null,
    runtime_strategy: l.runtime.strategy,
    wikipedia: l.links.wikipedia,
    homepage: l.links.homepage,
  });
  l.designers.forEach((name, ord) => ins("designers", { lang: l.id, ord, name }));
  l.aliases.forEach((alias) => ins("aliases", { lang: l.id, alias }));
  l.paradigms.forEach((paradigm) => ins("paradigms", { lang: l.id, paradigm }));
  l.execution.forEach((mode) => ins("execution", { lang: l.id, mode }));
  l.innovations.forEach((text, ord) => ins("innovations", { lang: l.id, ord, text }));
  l.influenced_by_external.forEach((x) => ins("external_influences", { lang: l.id, ...x }));
  for (const [concept, t] of Object.entries(l.traits)) ins("traits", { lang: l.id, concept, ...t });
  for (const [task, { concepts: shows, ...s }] of Object.entries(l.snippets)) {
    ins("snippets", { lang: l.id, task, ...s, verified: s.verified ? 1 : 0 });
    for (const concept of shows) ins("snippet_concepts", { lang: l.id, task, concept });
  }
  l.milestones.forEach((m) => ins("milestones", { lang: l.id, ...m }));
  l.runtime.toolchains.forEach((t, ord) => ins("toolchains", { lang: l.id, ord, ...t }));
  ins("search", {
    lang: l.id,
    name: l.name,
    aliases: l.aliases.join(" "),
    tagline: l.tagline,
    summary: l.summary,
    history: l.history,
    innovations: l.innovations.join("\n"),
  });
}
for (const e of world.edges) ins("lineage", { ...e, retro: e.retro ? 1 : 0 });
db.exec("COMMIT");
db.close();

// Denormalized bundle for the app: languages + reconciled edges + concepts + tasks.
await Deno.writeTextFile(
  new URL("world.json", dist),
  JSON.stringify({ generated_at: new Date().toISOString(), ...world }),
);

const snippetCount = languages.reduce((n, l) => n + Object.keys(l.snippets).length, 0);
const verified = languages.reduce((n, l) => n + Object.values(l.snippets).filter((s) => s.verified).length, 0);
console.log(
  `dist/pl.db + dist/world.json: ${languages.length} languages, ${world.edges.length} lineage edges, ` +
    `${concepts.length} concepts, ${snippetCount} snippets (${verified} verified)`,
);
