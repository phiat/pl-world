// Server-side facts about concepts ("genes"): who carries each one and since when, how adoption grew,
// which concepts travel together, and which snippets demonstrate it.
import { byId, type Concept, concepts, type Language, languages, tasks } from "./world.ts";
import { YEAR_FROM, YEAR_TO } from "./meta.ts";

export const FROM = YEAR_FROM, TO = YEAR_TO;
type Level = "core" | "supported" | "library";

export type Carrier = {
  lang: Language;
  level: Level;
  /** The year the language had it: `since` when recorded (a later version), else the language's first year. */
  acquired: number;
  version?: string;
  note?: string;
};

export type AdoptionPoint = { year: number; exist: number; core: number; supported: number; library: number };

const carriers = new Map<string, Carrier[]>(concepts.map((c) => [
  c.id,
  languages.flatMap((l): Carrier[] => {
    const t = l.traits[c.id];
    if (!t) return [];
    const acquired = Math.max(t.since ?? l.year, l.year);
    return [{ lang: l, level: t.level, acquired, version: t.version, note: t.note }];
  }).sort((a, b) => a.acquired - b.acquired || a.lang.year - b.lang.year || a.lang.name.localeCompare(b.lang.name)),
]));

export const carriersOf = (cid: string) => carriers.get(cid) ?? [];

const adoptions = new Map<string, AdoptionPoint[]>(concepts.map((c) => {
  const cs = carriersOf(c.id);
  const points: AdoptionPoint[] = [];
  for (let year = FROM; year <= TO; year++) {
    const had = cs.filter((x) => x.acquired <= year);
    points.push({
      year,
      exist: languages.filter((l) => l.year <= year).length,
      core: had.filter((x) => x.level === "core").length,
      supported: had.filter((x) => x.level === "supported").length,
      library: had.filter((x) => x.level === "library").length,
    });
  }
  return [c.id, points];
}));

export const adoptionOf = (cid: string) => adoptions.get(cid) ?? [];

/** Concepts whose carriers overlap most with this one's (Jaccard over the carrier sets). */
export function travelsWith(cid: string, n = 6) {
  const mine = new Set(carriersOf(cid).map((c) => c.lang.id));
  return concepts
    .filter((c) => c.id !== cid)
    .map((c) => {
      const theirs = carriersOf(c.id).map((x) => x.lang.id);
      const both = theirs.filter((id) => mine.has(id)).length;
      return { concept: c, both, overlap: both / (mine.size + theirs.length - both || 1) };
    })
    .filter((r) => r.both > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, n);
}

/** Snippets tagged as demonstrating this concept (data: snippet.concepts). */
export function demonstrations(cid: string) {
  return languages.flatMap((l) =>
    tasks.flatMap((t) => (l.snippets[t.id]?.concepts.includes(cid as never) ? [{ lang: l, task: t.id }] : []))
  );
}

// The task in which a concept naturally shows up, for side-by-side comparison in the Rosetta Desk.
const TASK_FOR: Record<string, string> = {
  recursion: "factorial",
  "tail-calls": "factorial",
  "structured-control": "fizzbuzz",
  "block-scope": "fizzbuzz",
  "first-class-functions": "higher-order",
  closures: "higher-order",
  "list-comprehensions": "higher-order",
  "array-programming": "higher-order",
  "lazy-evaluation": "higher-order",
  classes: "shapes",
  inheritance: "shapes",
  "everything-is-an-object": "shapes",
  prototypes: "shapes",
  "multiple-dispatch": "shapes",
  "traits-mixins": "shapes",
  "abstract-data-types": "shapes",
  "algebraic-data-types": "shapes",
  "pattern-matching": "shapes",
  interfaces: "shapes",
  "type-classes": "shapes",
  "structural-typing": "shapes",
};
export const taskFor = (cid: string) => TASK_FOR[cid] ?? null;

/** Where the idea came from and who spread it, as languages in this set (origin may be external). */
export function lineup(c: Concept) {
  const ids = [c.origin.lang, ...c.popularized_by].filter((id): id is NonNullable<typeof id> => !!id && byId.has(id));
  return [...new Set(ids)].map((id) => byId.get(id)!);
}

export const conceptIndex = concepts.map((c) => ({ concept: c, carriers: carriersOf(c.id).length }));
