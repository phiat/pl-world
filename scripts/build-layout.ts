// Lay out the Genealogy "web" view (every lineage edge as a layered DAG) with ELK, once, at build time.
// Writes dist/genealogy.json, which web/lib/genealogy.ts renders. Run after build-db.ts.
import { loadWorld } from "../data/world.ts";
import type { ELK, ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api.js";

// elk.bundled.js assumes it's inside a Web Worker when `self` exists and `document` doesn't, which is how
// Deno looks. A stand-in `document` while it loads makes it use its in-process worker instead.
(globalThis as { document?: unknown }).document = {};
// The CommonJS default export reaches Deno as the constructor itself, not as its declared module shape.
const { default: Elk } = await import("elkjs/lib/elk.bundled.js") as unknown as { default: new () => ELK };
const elk = new Elk();
delete (globalThis as { document?: unknown }).document;

/** Node box size; labels are IBM Plex Sans Condensed 12.5px, about 6.6px per character. */
const nodeSize = (name: string) => ({ width: Math.round(26 + name.length * 6.6), height: 24 });

const { languages, edges } = await loadWorld();
const sorted = languages.slice().sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
const lineage = edges.filter((e) => !e.retro); // cross-pollination edges point back in time; the River draws those

const graph: ElkNode = {
  id: "root",
  layoutOptions: {
    "elk.algorithm": "layered",
    "elk.direction": "DOWN",
    "elk.edgeRouting": "SPLINES",
    "elk.layered.spacing.nodeNodeBetweenLayers": "54",
    "elk.spacing.nodeNode": "14",
    "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    "elk.layered.crossingMinimization.forceNodeModelOrder": "false",
    "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    "elk.padding": "[top=24,left=24,bottom=24,right=24]",
  },
  children: sorted.map((l) => ({ id: l.id, ...nodeSize(l.name) })),
  edges: lineage.map((e, i): ElkExtendedEdge => ({
    id: `e${i}`,
    sources: [e.parent],
    targets: [e.child],
    // Keep the major lines straighter and shorter than passing influences.
    layoutOptions: e.weight === "major"
      ? { "elk.layered.priority.straightness": "10", "elk.layered.priority.shortness": "10" }
      : {},
  })),
};

const out = await elk.layout(graph);
const r = (n: number) => Math.round(n * 10) / 10;
const pt = (p: { x: number; y: number }) => `${r(p.x)},${r(p.y)}`;

const web = {
  width: Math.ceil(out.width ?? 0),
  height: Math.ceil(out.height ?? 0),
  nodes: (out.children ?? []).map((n) => ({ id: n.id, x: r(n.x!), y: r(n.y!), w: n.width!, h: n.height! })),
  edges: (out.edges ?? []).map((e, i) => {
    const s = e.sections?.[0];
    let d = "";
    if (s) {
      // Spline routes come back as cubic Bézier control points; anything else is drawn as a polyline.
      const rest = [...(s.bendPoints ?? []), s.endPoint];
      d = rest.length % 3 === 0
        ? `M${pt(s.startPoint)}` + rest.map((p, j) => (j % 3 === 0 ? "C" : " ") + pt(p)).join("")
        : `M${pt(s.startPoint)}` + rest.map((p) => `L${pt(p)}`).join("");
    }
    return { parent: lineage[i].parent, child: lineage[i].child, d };
  }),
};

await Deno.mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await Deno.writeTextFile(new URL("../dist/genealogy.json", import.meta.url), JSON.stringify({ web }));
console.log(
  `dist/genealogy.json: web ${web.width}×${web.height}, ${web.nodes.length} nodes, ${web.edges.length} edges`,
);
