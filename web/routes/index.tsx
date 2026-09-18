import { define } from "../utils.ts";
import River, { type RiverEdge, type RiverNode } from "../islands/River.tsx";
import { concepts, edges, languages } from "../lib/world.ts";
import type { ConceptLite, TraitLite } from "../lib/meta.ts";

const nodes: RiverNode[] = languages.map((l) => ({
  id: l.id,
  name: l.name,
  year: l.year,
  family: l.family,
  status: l.status,
  tagline: l.tagline,
  designers: l.designers,
  traits: Object.fromEntries(
    Object.entries(l.traits).map((
      [c, t],
    ) => [c, { level: t!.level, since: t!.since, version: t!.version, note: t!.note }]),
  ) as Record<string, TraitLite>,
}));
const riverEdges: RiverEdge[] = edges.map((e) => ({
  parent: e.parent,
  child: e.child,
  kind: e.kind,
  weight: e.weight,
  retro: e.retro,
}));
const conceptLites = concepts as ConceptLite[];

export default define.page(function Home({ url }) {
  const gene = url.searchParams.get("gene") ?? "";
  return (
    <section class="wrap">
      <River
        nodes={nodes}
        edges={riverEdges}
        concepts={conceptLites}
        initialGene={concepts.some((c) => c.id === gene) ? gene : ""}
      />
    </section>
  );
});
