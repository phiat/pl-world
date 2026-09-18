import { useMemo, useState } from "preact/hooks";
import { famColor } from "../lib/meta.ts";
import type { Chart, ChartEdge, ChartNode } from "../lib/genealogy.ts";

type Props = { mode: "tree" | "web"; chart: Chart };

/** Everything reachable from `id` along `next`. */
function reach(id: string, next: Map<string, string[]>) {
  const seen = new Set<string>(), stack = [id];
  while (stack.length) {
    for (const v of next.get(stack.pop()!) ?? []) if (!seen.has(v)) seen.add(v), stack.push(v);
  }
  return seen;
}

export default function GenealogyChart({ mode, chart }: Props) {
  const [focus, setFocus] = useState<string | null>(null);
  const [up, down] = useMemo(() => {
    const up = new Map<string, string[]>(), down = new Map<string, string[]>();
    for (const e of chart.edges) {
      up.set(e.child, [...(up.get(e.child) ?? []), e.parent]);
      down.set(e.parent, [...(down.get(e.parent) ?? []), e.child]);
    }
    return [up, down];
  }, [chart]);
  const anc = useMemo(() => (focus ? reach(focus, up) : new Set<string>()), [focus]);
  const desc = useMemo(() => (focus ? reach(focus, down) : new Set<string>()), [focus]);

  const nodeClass = (n: ChartNode) =>
    ["node", n.historical && "historical", focus === n.id ? "focus" : anc.has(n.id) ? "anc" : desc.has(n.id) && "desc"]
      .filter(Boolean).join(" ");
  const edgeClass = (e: ChartEdge) => {
    const cls = ["edge", `k-${e.kind}`, e.weight];
    if ((e.child === focus || anc.has(e.child)) && anc.has(e.parent)) cls.push("anc");
    else if ((e.parent === focus || desc.has(e.parent)) && desc.has(e.child)) cls.push("desc");
    return cls.join(" ");
  };
  const open = (id: string) => location.assign(`/tree?of=${id}`);

  return (
    <svg
      class={`gchart ${mode}${focus ? " tracing" : ""}`}
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      width={chart.width}
      height={chart.height}
      role="group"
      aria-label={mode === "tree" ? "Family tree of programming languages by primary parent" : "Influence web"}
    >
      {chart.decades.map(({ year, x }) => (
        <g key={year}>
          <line class="decade" x1={x} x2={x} y1={24} y2={chart.height - 6} />
          <text class="decade-label" x={x} y={16} text-anchor="middle">{year}</text>
        </g>
      ))}
      <g>
        {chart.edges.map((e) => <path key={`${e.parent}>${e.child}`} class={edgeClass(e)} d={e.d} />)}
      </g>
      <g>
        {chart.nodes.map((n) => (
          <g
            key={n.id}
            class={nodeClass(n)}
            transform={`translate(${n.x},${n.y})`}
            style={`--fc:${famColor(n.family)}`}
            tabIndex={0}
            role="link"
            aria-label={`${n.name}, ${n.year}: open pedigree`}
            onMouseEnter={() => setFocus(n.id)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(n.id)}
            onBlur={() => setFocus(null)}
            onClick={() => open(n.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") open(n.id);
            }}
          >
            <title>{`${n.name} · ${n.year} — ${n.tagline}`}</title>
            {mode === "tree"
              ? (
                <>
                  <circle class="dot" r="5.5" />
                  <text x="10" y="4.5">{n.name}</text>
                </>
              )
              : (
                <>
                  <rect class="box" width={n.w} height={n.h} rx={n.h / 2} />
                  <circle class="dot" cx="12" cy={n.h / 2} r="4.5" />
                  <text x="21" y={n.h / 2 + 4.3}>{n.name}</text>
                </>
              )}
          </g>
        ))}
      </g>
    </svg>
  );
}
