// Server-side layouts for the Genealogy view: the family tree (primary parents against a time axis), the
// influence web (every lineage edge, laid out by ELK at build time in scripts/build-layout.ts) and pedigrees.
import layout from "../../dist/genealogy.json" with { type: "json" };
import { byId, type Edge, edges, type Language, languages } from "./world.ts";

export type ChartNode = {
  id: string;
  name: string;
  year: number;
  family: string;
  tagline: string;
  historical: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};
export type ChartEdge = { parent: string; child: string; kind: string; weight: string; note: string | null; d: string };
export type Chart = {
  width: number;
  height: number;
  nodes: ChartNode[];
  edges: ChartEdge[];
  decades: { year: number; x: number }[];
};

// Cross-pollination edges point back in time (a newer language feeding an older one's later version);
// the River draws those. Genealogy is about descent.
const lineage = edges.filter((e) => !e.retro);
const edgeOf = new Map(lineage.map((e) => [`${e.parent}>${e.child}`, e]));
const node = (l: Language, x: number, y: number, w = 0, h = 0): ChartNode => ({
  id: l.id,
  name: l.name,
  year: l.year,
  family: l.family,
  tagline: l.tagline,
  historical: l.status === "historical",
  x,
  y,
  w,
  h,
});
const edgeProps = (e: Edge, d: string): ChartEdge => ({
  parent: e.parent,
  child: e.child,
  kind: e.kind,
  weight: e.weight,
  note: e.note ?? null,
  d,
});

// ── Family tree ────────────────────────────────────────────────────────────────────────────────────
// Every language hangs from its primary parent. Rows are an in-order walk (older half of the children
// above the parent, newer half below), which keeps each subtree contiguous, so no connector ever
// crosses a label. x is the year.

const YEAR0 = 1953, PX_YEAR = 15, ROW = 22, ROOT_GAP = 16, TOP = 44, LEFT = 20;
export const treeX = (year: number) => LEFT + (year - YEAR0) * PX_YEAR;

export const tree: Chart & { roots: string[] } = (() => {
  const kids = new Map<string, Language[]>();
  const roots: Language[] = [];
  for (const l of languages) { // sorted by year
    const p = l.primary_parent && byId.has(l.primary_parent) ? l.primary_parent : null;
    if (p) kids.set(p, [...(kids.get(p) ?? []), l]);
    else roots.push(l);
  }
  const y = new Map<string, number>();
  let row = 0, gap = 0;
  const place = (l: Language) => {
    const ks = kids.get(l.id) ?? [];
    const half = Math.floor(ks.length / 2);
    ks.slice(0, half).forEach(place);
    y.set(l.id, TOP + row++ * ROW + gap);
    ks.slice(half).forEach(place);
  };
  roots.forEach((r, i) => {
    if (i) gap += ROOT_GAP;
    place(r);
  });

  const nodes = languages.map((l) => node(l, treeX(l.year), y.get(l.id)!));
  const chartEdges: ChartEdge[] = [];
  for (const l of languages) {
    const p = l.primary_parent && byId.get(l.primary_parent);
    if (!p) continue;
    const [xp, yp, xc, yc] = [treeX(p.year), y.get(p.id)!, treeX(l.year), y.get(l.id)!];
    const r = Math.min(6, xc - xp, Math.abs(yc - yp)), s = Math.sign(yc - yp);
    const d = r > 0 ? `M${xp},${yp}V${yc - s * r}Q${xp},${yc} ${xp + r},${yc}H${xc}` : `M${xp},${yp}V${yc}H${xc}`;
    const e = edgeOf.get(`${p.id}>${l.id}`) ??
      { parent: p.id, child: l.id, kind: "influence", weight: "major", note: null } as Edge;
    chartEdges.push(edgeProps(e, d));
  }
  return {
    width: treeX(2026) + 150,
    height: TOP + row * ROW + gap + 20,
    nodes,
    edges: chartEdges,
    decades: [1960, 1970, 1980, 1990, 2000, 2010, 2020].map((year) => ({ year, x: treeX(year) })),
    roots: roots.map((r) => r.id),
  };
})();

// ── Influence web ──────────────────────────────────────────────────────────────────────────────────

export const web: Chart = {
  width: layout.web.width,
  height: layout.web.height,
  nodes: layout.web.nodes.filter((n) => byId.has(n.id)).map((n) => node(byId.get(n.id)!, n.x, n.y, n.w, n.h)),
  edges: layout.web.edges.flatMap((e) => {
    const full = edgeOf.get(`${e.parent}>${e.child}`);
    return full ? [edgeProps(full, e.d)] : [];
  }),
  decades: [],
};

// ── Pedigree ───────────────────────────────────────────────────────────────────────────────────────
// Ancestors to the left (three generations), descendants to the right (two), one column per generation.
// Direct parents and children include minor influences; further out only major lines are followed,
// unless `all` is set.

export const CARD_W = 152, CARD_H = 46;
const GAP_X = 44, GAP_Y = 10, PAD = 12, UP = 3, DOWN = 2;

export type PedigreeCard = ChartNode & { gen: number; relation: string | null; minor: boolean };
export type Pedigree = {
  focus: string;
  width: number;
  height: number;
  cards: PedigreeCard[];
  edges: ChartEdge[];
  parents: Edge[];
  children: Edge[];
};

export function pedigree(id: string, all = false): Pedigree {
  const follows = (e: Edge, g: number) => all || g <= 1 || e.weight === "major";
  const gen = new Map<string, number>([[id, 0]]);
  for (const dir of [-1, 1] as const) {
    let frontier = [id];
    for (let g = 1; g <= (dir < 0 ? UP : DOWN) && frontier.length; g++) {
      const next: string[] = [];
      for (const u of frontier) {
        for (const e of lineage) {
          const v = dir < 0 ? (e.child === u ? e.parent : null) : (e.parent === u ? e.child : null);
          if (v && !gen.has(v) && follows(e, g)) {
            gen.set(v, dir * g);
            next.push(v);
          }
        }
      }
      frontier = next;
    }
  }

  // Edges drawn: between adjacent generations only, under the same major-lines rule.
  const drawn = lineage.filter((e) => {
    const gp = gen.get(e.parent), gc = gen.get(e.child);
    if (gp === undefined || gc === undefined || gc - gp !== 1) return false;
    return follows(e, Math.max(Math.abs(gp), Math.abs(gc)));
  });

  // Columns: the generations next to the focus sorted by year; further ones by the average position of
  // what they connect to in the column nearer the focus, which keeps crossings down.
  const cols = new Map<number, string[]>();
  for (const [n, g] of gen) cols.set(g, [...(cols.get(g) ?? []), n]);
  const year = (n: string) => byId.get(n)!.year;
  for (const g of [-1, 1, -2, 2, -3]) {
    const ids = cols.get(g);
    if (!ids) continue;
    if (Math.abs(g) === 1) {
      ids.sort((a, b) => year(a) - year(b) || a.localeCompare(b));
      continue;
    }
    const pos = new Map((cols.get(g < 0 ? g + 1 : g - 1) ?? []).map((n, i) => [n, i]));
    const bary = (n: string) => {
      const ps = drawn.flatMap((e) =>
        g < 0
          ? (e.parent === n && pos.has(e.child) ? [pos.get(e.child)!] : [])
          : (e.child === n && pos.has(e.parent) ? [pos.get(e.parent)!] : [])
      );
      return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : Infinity;
    };
    ids.sort((a, b) => bary(a) - bary(b) || year(a) - year(b));
  }

  const gens = [...cols.keys()].sort((a, b) => a - b);
  const colH = (n: number) => n * CARD_H + (n - 1) * GAP_Y;
  const maxH = Math.max(...gens.map((g) => colH(cols.get(g)!.length)));
  const at = new Map<string, { x: number; y: number }>();
  const cards: PedigreeCard[] = [];
  gens.forEach((g, ci) => {
    const ids = cols.get(g)!;
    const top = PAD + (maxH - colH(ids.length)) / 2;
    ids.forEach((n, i) => {
      const x = PAD + ci * (CARD_W + GAP_X), y = top + i * (CARD_H + GAP_Y);
      at.set(n, { x, y });
      const direct = g === -1 ? edgeOf.get(`${n}>${id}`) : g === 1 ? edgeOf.get(`${id}>${n}`) : undefined;
      cards.push({
        ...node(byId.get(n)!, x, y, CARD_W, CARD_H),
        gen: g,
        relation: direct?.kind ?? null,
        minor: direct?.weight === "minor",
      });
    });
  });

  const dx = GAP_X / 2;
  const chartEdges = drawn.map((e) => {
    const p = at.get(e.parent)!, c = at.get(e.child)!;
    const [x1, y1, x2, y2] = [p.x + CARD_W, p.y + CARD_H / 2, c.x, c.y + CARD_H / 2];
    return edgeProps(e, `M${x1},${y1}C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
  });

  const weightFirst = (a: Edge, b: Edge) => (a.weight === b.weight ? 0 : a.weight === "major" ? -1 : 1);
  return {
    focus: id,
    width: PAD * 2 + gens.length * (CARD_W + GAP_X) - GAP_X,
    height: PAD * 2 + maxH,
    cards,
    edges: chartEdges,
    parents: lineage.filter((e) => e.child === id).sort((a, b) => weightFirst(a, b) || year(a.parent) - year(b.parent)),
    children: lineage.filter((e) => e.parent === id).sort((a, b) => weightFirst(a, b) || year(a.child) - year(b.child)),
  };
}
