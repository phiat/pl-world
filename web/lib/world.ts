// Server-only access to the data set. `deno task dev` regenerates ../dist/world.json first.
import raw from "../../dist/world.json" with { type: "json" };
import type { Edge, World } from "../../data/world.ts";
import type { Concept, Language } from "../../data/schema.ts";
import { CATEGORIES } from "./meta.ts";

export type { Concept, Edge, Language };

const world = raw as unknown as World;

export const languages: Language[] = world.languages.slice().sort((a, b) =>
  a.year - b.year || a.name.localeCompare(b.name)
);
export const edges: Edge[] = world.edges;
export const concepts: Concept[] = world.concepts;
export const tasks = world.tasks;
export const byId = new Map(languages.map((l) => [l.id as string, l]));
export const conceptById = new Map(concepts.map((c) => [c.id, c]));
/** Concepts grouped by category, in display order. */
export const orderedConcepts: Concept[] = CATEGORIES.flatMap(([cat]) => concepts.filter((c) => c.category === cat));

export const parentsOf = (id: string) => edges.filter((e) => e.child === id && !e.retro);
export const childrenOf = (id: string) => edges.filter((e) => e.parent === id && !e.retro);
/** Newer languages this one later borrowed from ("cross-pollination"). */
export const laterInfluencesOf = (id: string) => edges.filter((e) => e.child === id && e.retro);

// Trait similarity: weighted Jaccard, each concept weighted by rarity (IDF), so sharing type classes
// says more about kinship than sharing recursion does.
const LEVEL_W = { core: 1, supported: 0.6, library: 0.35 } as const;
const idf = new Map(concepts.map((c) => {
  const df = languages.filter((l) => l.traits[c.id]).length;
  return [c.id, Math.log((languages.length + 1) / (df + 1)) + 0.15];
}));
export function similarity(a: Language, b: Language): number {
  let min = 0, max = 0;
  for (const c of concepts) {
    const x = LEVEL_W[a.traits[c.id]?.level as keyof typeof LEVEL_W] ?? 0;
    const y = LEVEL_W[b.traits[c.id]?.level as keyof typeof LEVEL_W] ?? 0;
    min += Math.min(x, y) * idf.get(c.id)!;
    max += Math.max(x, y) * idf.get(c.id)!;
  }
  return max ? min / max : 0;
}

const adjacency = new Map(languages.map((l) => [l.id as string, new Set<string>()]));
for (const e of edges) {
  adjacency.get(e.parent)!.add(e.child);
  adjacency.get(e.child)!.add(e.parent);
}
const distCache = new Map<string, Map<string, number>>();
/** Undirected lineage distance from `id` to every connected language. */
export function lineageDistances(id: string): Map<string, number> {
  let d = distCache.get(id);
  if (d) return d;
  d = new Map([[id, 0]]);
  const queue = [id];
  while (queue.length) {
    const u = queue.shift()!;
    for (const v of adjacency.get(u) ?? []) {
      if (!d.has(v)) {
        d.set(v, d.get(u)! + 1);
        queue.push(v);
      }
    }
  }
  distCache.set(id, d);
  return d;
}

export function closestByTraits(id: string, n = 5) {
  const l = byId.get(id)!;
  const d = lineageDistances(id);
  return languages.filter((o) => o.id !== id)
    .map((o) => ({ lang: o, sim: similarity(l, o), dist: d.get(o.id) }))
    .sort((a, b) => b.sim - a.sim).slice(0, n);
}

/** Similar trait profiles, three or more lineage steps apart: independent arrival at similar designs. */
export const convergentPairs = (() => {
  const rich = (l: Language) => Object.keys(l.traits).length >= 14;
  const pairs: { a: Language; b: Language; sim: number; dist?: number }[] = [];
  for (let i = 0; i < languages.length; i++) {
    for (let j = i + 1; j < languages.length; j++) {
      const a = languages[i], b = languages[j], dist = lineageDistances(a.id).get(b.id);
      if ((dist === undefined || dist >= 3) && rich(a) && rich(b)) pairs.push({ a, b, sim: similarity(a, b), dist });
    }
  }
  return pairs.sort((x, y) => y.sim - x.sim).slice(0, 8);
})();

/** The toolchain the sandbox runner uses, if any: some languages only run on their original platform (AppleScript). */
export const sandboxToolchain = (l: Language) => l.runtime.toolchains.find((t) => t.docker_image);

export const stats = {
  languages: languages.length,
  concepts: concepts.length,
  snippets: languages.reduce((n, l) => n + Object.keys(l.snippets).length, 0),
  runnable: languages.filter(sandboxToolchain).reduce((n, l) => n + Object.keys(l.snippets).length, 0),
  verified: languages.reduce((n, l) => n + Object.values(l.snippets).filter((s) => s.verified).length, 0),
};
