// River island props, built once on the server. The concept pages pass `only` to ship a single trait per
// language instead of all of them.
import type { RiverEdge, RiverNode } from "../islands/River.tsx";
import type { TraitLite } from "./meta.ts";
import { edges, languages } from "./world.ts";

export function riverNodes(only?: string): RiverNode[] {
  return languages.map((l) => ({
    id: l.id,
    name: l.name,
    year: l.year,
    family: l.family,
    status: l.status,
    tagline: l.tagline,
    designers: l.designers,
    traits: Object.fromEntries(
      Object.entries(l.traits)
        .filter(([c]) => !only || c === only)
        .map(([c, t]) => [c, { level: t!.level, since: t!.since, version: t!.version, note: t!.note }]),
    ) as Record<string, TraitLite>,
  }));
}

export const riverEdges: RiverEdge[] = edges.map((e) => ({
  parent: e.parent,
  child: e.child,
  kind: e.kind,
  weight: e.weight,
  retro: e.retro,
}));
