import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { CATEGORIES, CATEGORY, type ConceptLite, famColor, FAMILIES, FAMILY, type TraitLite } from "../lib/meta.ts";
import { DnaStrip } from "../components/DnaStrip.tsx";

export type RiverNode = {
  id: string;
  name: string;
  year: number;
  family: string;
  status: string;
  tagline: string;
  designers: string[];
  traits: Record<string, TraitLite>;
};
export type RiverEdge = { parent: string; child: string; kind: string; weight: string; retro: boolean };

type Props = { nodes: RiverNode[]; edges: RiverEdge[]; concepts: ConceptLite[]; initialGene?: string };

const YMIN = 1955, YMAX = 2026, PX = 17, X0 = 132, TOP = 40, ROW = 25, LPAD = 9;
const xOf = (y: number) => X0 + (y - YMIN) * PX;

function layout(nodes: RiverNode[]) {
  const pos = new Map<string, { x: number; y: number }>();
  const lanes: { family: string; y: number; h: number }[] = [];
  let y = TOP, maxX = xOf(YMAX);
  for (const [family] of FAMILIES) {
    const members = nodes.filter((n) => n.family === family);
    if (!members.length) continue;
    const rowEnds: number[] = [];
    const rowOf = new Map<string, number>();
    for (const n of members) {
      const nx = xOf(n.year), width = 16 + n.name.length * 7.4;
      let r = rowEnds.findIndex((end) => end + 6 < nx);
      if (r < 0) {
        r = rowEnds.length;
        rowEnds.push(0);
      }
      rowEnds[r] = nx + width;
      rowOf.set(n.id, r);
      maxX = Math.max(maxX, nx + width);
    }
    const h = rowEnds.length * ROW + LPAD * 2;
    for (const n of members) pos.set(n.id, { x: xOf(n.year), y: y + LPAD + rowOf.get(n.id)! * ROW + ROW / 2 });
    lanes.push({ family, y, h });
    y += h;
  }
  return { pos, lanes, width: maxX + 30, height: y + 34 };
}

function edgePath(e: RiverEdge, p: { x: number; y: number }, c: { x: number; y: number }) {
  if (e.retro) {
    // newer → older: loop over the top so it reads as feedback, not ancestry
    const lift = 40 + Math.abs(p.x - c.x) * 0.12;
    return `M${p.x},${p.y} C${p.x},${p.y - lift} ${c.x},${c.y - lift} ${c.x},${c.y}`;
  }
  const dx = Math.max(36, Math.abs(c.x - p.x) / 2);
  return `M${p.x},${p.y} C${p.x + dx},${p.y} ${c.x - dx},${c.y} ${c.x},${c.y}`;
}

export default function River({ nodes, edges, concepts, initialGene = "" }: Props) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const { pos, lanes, width, height } = useMemo(() => layout(nodes), [nodes]);
  const [year, setYear] = useState(YMAX);
  const [gene, setGene] = useState(initialGene);
  const [minor, setMinor] = useState(false);
  const [retro, setRetro] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    const url = new URL(location.href);
    if (gene) url.searchParams.set("gene", gene);
    else url.searchParams.delete("gene");
    history.replaceState(null, "", url);
  }, [gene]);

  useEffect(() => {
    if (!playing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setYear(YMAX);
      setPlaying(false);
      return;
    }
    const start = performance.now(), dur = 9000;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      setYear(Math.round(YMIN + (YMAX - YMIN) * k));
      if (k < 1) raf.current = requestAnimationFrame(step);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const alive = (id: string) => byId.get(id)!.year <= year;
  const edgeShown = (e: RiverEdge) =>
    (e.retro ? retro : e.weight === "major" || minor) && alive(e.parent) && alive(e.child);

  // Ancestors/descendants of the hovered (or pinned) language over the visible, non-retro edges.
  const focus = hover ?? pinned;
  const { anc, desc } = useMemo(() => {
    const anc = new Set<string>(), desc = new Set<string>();
    if (!focus) return { anc, desc };
    const vis = edges.filter((e) => !e.retro && edgeShown(e));
    const walk = (start: string, next: (u: string) => string[], into: Set<string>) => {
      const stack = [start];
      while (stack.length) {
        for (const v of next(stack.pop()!)) {
          if (!into.has(v)) {
            into.add(v);
            stack.push(v);
          }
        }
      }
    };
    walk(focus, (u) => vis.filter((e) => e.child === u).map((e) => e.parent), anc);
    walk(focus, (u) => vis.filter((e) => e.parent === u).map((e) => e.child), desc);
    return { anc, desc };
  }, [focus, year, minor, retro, edges]);

  const concept = gene ? concepts.find((c) => c.id === gene) : undefined;
  const geneColor = concept ? CATEGORY[concept.category].color : undefined;
  const traitAt = (n: RiverNode) => {
    const t = gene ? n.traits[gene] : undefined;
    return t && (t.since ?? n.year) <= year ? t : undefined;
  };
  const carriers = concept ? nodes.filter((n) => n.year <= year && traitAt(n)).length : 0;
  const pin = pinned ? byId.get(pinned) : undefined;

  const nodeClass = (n: RiverNode) => {
    const cls = ["node"];
    if (n.status === "historical") cls.push("historical");
    if (n.year > year) cls.push("future");
    if (focus === n.id) cls.push("focus");
    else if (anc.has(n.id)) cls.push("anc");
    else if (desc.has(n.id)) cls.push("desc");
    if (concept) cls.push("g-" + (traitAt(n)?.level ?? "none"));
    return cls.join(" ");
  };
  const edgeClass = (e: RiverEdge) => {
    const cls = ["edge", e.retro ? "retro" : `k-${e.kind} ${e.weight}`];
    if (focus && !e.retro) {
      if ((e.child === focus || anc.has(e.child)) && anc.has(e.parent)) cls.push("anc");
      else if ((e.parent === focus || desc.has(e.parent)) && desc.has(e.child)) cls.push("desc");
    }
    return cls.join(" ");
  };

  return (
    <div>
      <div class="intro">
        <div>
          <h1>
            Seventy years of programming languages, <em>and the ideas they passed on.</em>
          </h1>
          <p>
            Hover a language to trace its ancestors (amber) and descendants (blue). Drag the year to rewind history, or
            pick a concept to watch it spread through the family.
          </p>
        </div>
        <div class="yearbox" aria-live="polite">
          <strong>{year}</strong>
          <span>{nodes.filter((n) => n.year <= year).length} of {nodes.length} languages exist</span>
        </div>
      </div>

      <div class="river-controls">
        <button type="button" class="btn" onClick={() => setPlaying(!playing)}>
          {playing ? "❚❚ Pause" : "▶ Play history"}
        </button>
        <input
          id="scrub"
          type="range"
          min={YMIN}
          max={YMAX}
          value={year}
          aria-label="Year"
          onInput={(e) => {
            setPlaying(false);
            setYear(Number(e.currentTarget.value));
          }}
        />
        <label class="ctl">
          Concept
          <select id="gene" value={gene} onChange={(e) => setGene(e.currentTarget.value)}>
            <option value="">None</option>
            {CATEGORIES.map(([cat, label]) => (
              <optgroup key={cat} label={label}>
                {concepts.filter((c) => c.category === cat).map((c) => <option key={c.id} value={c.id}>{c.name}
                </option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label class="ctl">
          <input id="minor" type="checkbox" checked={minor} onChange={(e) => setMinor(e.currentTarget.checked)} />{" "}
          Minor influences
        </label>
        <label
          class="ctl"
          title="A newer language feeding ideas back into a later version of an older one (Kotlin → PHP 8)"
        >
          <input id="retro" type="checkbox" checked={retro} onChange={(e) => setRetro(e.currentTarget.checked)} />{" "}
          Cross-pollination
        </label>
      </div>

      {concept && (
        <div class="gene-card" style={`--gc:${geneColor}`}>
          <div>
            <span class="eyebrow" style={`color:${geneColor}`}>{CATEGORY[concept.category].label}</span>
            <h3>{concept.name}</h3>
          </div>
          <div class="count">
            {carriers}
            <small>carriers in {year}</small>
          </div>
          <p>
            {concept.summary} {concept.origin.note && <span class="note">{concept.origin.note}</span>}
          </p>
          <div class="chips">
            <span class="eyebrow" style="align-self:center">Origin</span>
            {concept.origin.lang && byId.get(concept.origin.lang)
              ? (
                <a class="chip" href={`/lang/${concept.origin.lang}`}>
                  <i style={`background:${famColor(byId.get(concept.origin.lang)!.family)}`} />
                  {byId.get(concept.origin.lang)!.name} <small>{concept.origin.year}</small>
                </a>
              )
              : (
                <span class="chip">
                  {concept.origin.external} <small>{concept.origin.year}</small>
                </span>
              )}
            <span class="eyebrow" style="align-self:center;margin-left:8px">Popularized by</span>
            {concept.popularized_by.filter((p) => byId.has(p)).map((p) => (
              <a key={p} class="chip" href={`/lang/${p}`}>
                <i style={`background:${famColor(byId.get(p)!.family)}`} />
                {byId.get(p)!.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div class={`river-layout ${pin ? "has-card" : ""}`}>
        <div class="river-scroll">
          <svg
            id="river"
            class={[focus && "tracing", concept && "gene"].filter(Boolean).join(" ")}
            style={geneColor ? `--gc:${geneColor}` : undefined}
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            role="img"
            aria-label="Timeline of programming languages by family, with lineage links"
          >
            {lanes.map((lane, i) => (
              <g key={lane.family}>
                {i % 2 === 0 && <rect x="0" y={lane.y} width={width} height={lane.h} fill="var(--band)" />}
                <text class="lane-label" x="24" y={lane.y + LPAD + ROW / 2 + 4}>{FAMILY[lane.family].label}</text>
              </g>
            ))}
            {Array.from(
              { length: Math.floor((height - TOP - 28) / 18) },
              (_, i) => <circle key={i} class="sprocket" cx="10" cy={TOP + 8 + i * 18} r="3.2" />,
            )}
            {[1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => (
              <g key={d}>
                <line class="decade" x1={xOf(d)} x2={xOf(d)} y1={TOP - 8} y2={height - 26} />
                <text class="decade-label" x={xOf(d)} y={TOP - 14} text-anchor="middle">{d}</text>
                <text class="decade-label" x={xOf(d)} y={height - 10} text-anchor="middle">{d}</text>
              </g>
            ))}
            <g>
              {edges.filter(edgeShown).map((e) => (
                <path
                  key={`${e.parent}>${e.child}`}
                  class={edgeClass(e)}
                  d={edgePath(e, pos.get(e.parent)!, pos.get(e.child)!)}
                />
              ))}
            </g>
            <g>
              {nodes.map((n) => {
                const p = pos.get(n.id)!;
                const t = traitAt(n);
                const isOrigin = concept?.origin.lang === n.id;
                const label = isOrigin
                  ? `origin ${concept!.origin.year}`
                  : t?.since
                  ? (t.version ? `${t.version}, ${t.since}` : `since ${t.since}`)
                  : "";
                return (
                  <g
                    key={n.id}
                    class={nodeClass(n)}
                    transform={`translate(${p.x},${p.y})`}
                    style={`--fc:${famColor(n.family)}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${n.name}, ${n.year}`}
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(n.id)}
                    onBlur={() => setHover(null)}
                    onClick={() => setPinned(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPinned(n.id);
                      }
                    }}
                  >
                    <title>{`${n.name} · ${n.year} — ${n.tagline}`}</title>
                    {isOrigin && <circle class="ring" r="10" />}
                    <circle class="dot" r="6" fill={famColor(n.family)} />
                    <text x="11" y="4.5">{n.name}</text>
                    {label && <text class="since" x="11" y="17">{label}</text>}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {pin && (
          <aside class="river-card" style={`--lc:${famColor(pin.family)}`}>
            <button type="button" class="x" aria-label="Close" onClick={() => setPinned(null)}>×</button>
            <span class="eyebrow">{FAMILY[pin.family]?.label} family · {pin.year}</span>
            <h3>{pin.name}</h3>
            <div class="note">{pin.designers.join(", ")}</div>
            <p class="tag">{pin.tagline}</p>
            <DnaStrip traits={pin.traits} concepts={concepts} />
            <div class="pl-actions">
              <a class="btn primary" href={`/lang/${pin.id}`}>Open page</a>
              <a class="btn" href={`/compare?add=${pin.id}`}>Add to Rosetta Desk</a>
              <a class="btn" href={`/tree?of=${pin.id}`}>Pedigree</a>
            </div>
          </aside>
        )}
      </div>

      <div class="legend">
        {FAMILIES.filter(([f]) => nodes.some((n) => n.family === f)).map(([f, label, color]) => (
          <span key={f}>
            <svg width="12" height="12">
              <circle cx="6" cy="6" r="5" fill={color} />
            </svg>{" "}
            {label}
          </span>
        ))}
        <span>
          <svg width="12" height="12">
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>{" "}
          historical
        </span>
        {[["successor", "2.2", ""], ["superset", "3.2", ""], ["dialect", "1.8", ""], ["influence", "1.2", "5 3"], [
          "platform",
          "2",
          "1 3",
        ]].map(([k, w, dash]) => (
          <span key={k}>
            <svg width="34" height="8">
              <line
                x1="1"
                x2="34"
                y1="4"
                y2="4"
                stroke="currentColor"
                stroke-width={w}
                stroke-dasharray={dash || undefined}
                stroke-linecap="round"
              />
            </svg>{" "}
            {k}
          </span>
        ))}
        <span>
          <svg width="34" height="8">
            <line x1="0" x2="34" y1="4" y2="4" stroke="var(--hl-meta)" stroke-width="1.4" stroke-dasharray="3 3" />
          </svg>{" "}
          cross-pollination
        </span>
      </div>
    </div>
  );
}
