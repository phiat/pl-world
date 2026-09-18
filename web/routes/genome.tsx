import { define } from "../utils.ts";
import GenomeSort from "../islands/GenomeSort.tsx";
import { byId, convergentPairs, type Language, languages, orderedConcepts, similarity } from "../lib/world.ts";
import { CATEGORIES, CATEGORY, famColor, FAMILIES } from "../lib/meta.ts";

const CELL = 14, GAP = 2, CATGAP = 8, LABW = 150, HEAD = 168;
const famIdx = new Map<string, number>(FAMILIES.map(([f], i) => [f, i]));
const options = languages.map((l) => ({ id: l.id, name: l.name, year: l.year }));

// Column positions never change, so compute them once.
const colX: number[] = [];
let width = LABW;
for (let i = 0; i < orderedConcepts.length; i++) {
  if (i && orderedConcepts[i - 1].category !== orderedConcepts[i].category) width += CATGAP;
  colX.push(width);
  width += CELL + GAP;
}
width += 90; // room for the last rotated column labels

const detail = (l: Language, cid: string) => {
  const t = l.traits[cid];
  if (!t) return "absent";
  return t.level + (t.version ? ` · ${t.version}` : t.since ? ` · since ${t.since}` : "") +
    (t.note ? `\n${t.note}` : "");
};

export default define.page(function Genome({ url }) {
  const q = url.searchParams;
  const sort = ["year", "family", "sim", "count"].includes(q.get("sort") ?? "") ? q.get("sort")! : "year";
  const ref = byId.get(q.get("to") ?? "") ?? byId.get("rust")!;
  const simTo = new Map(languages.map((l) => [l.id, similarity(ref, l)]));
  const rows = languages.slice().sort(
    sort === "family"
      ? (a, b) => famIdx.get(a.family)! - famIdx.get(b.family)! || a.year - b.year
      : sort === "sim"
      ? (a, b) => simTo.get(b.id)! - simTo.get(a.id)!
      : sort === "count"
      ? (a, b) => Object.keys(b.traits).length - Object.keys(a.traits).length
      : (a, b) => a.year - b.year,
  );
  const height = HEAD + rows.length * (CELL + GAP) + 12;

  return (
    <section class="wrap">
      <div class="desk-bar">
        <h2>Genome</h2>
        <GenomeSort sort={sort} to={ref.id} options={options} />
      </div>
      <div class="genome-grid">
        <div class="matrix-wrap">
          <svg
            id="matrix"
            role="img"
            aria-label="Matrix of languages by concepts"
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
          >
            {CATEGORIES.map(([cat, , color]) => {
              const idx = orderedConcepts.findIndex((c) => c.category === cat);
              if (idx < 0) return null;
              const n = orderedConcepts.filter((c) => c.category === cat).length;
              return (
                <rect key={cat} x={colX[idx]} y={HEAD - 8} width={n * (CELL + GAP) - GAP} height={3} fill={color} />
              );
            })}
            {orderedConcepts.map((c, i) => (
              <a key={c.id} href={`/?gene=${c.id}`}>
                <text class="collab" transform={`translate(${colX[i] + CELL / 2 + 4},${HEAD - 14}) rotate(-62)`}>
                  <title>{`${c.name}: ${c.summary}`}</title>
                  {c.name}
                </text>
              </a>
            ))}
            {rows.map((l, r) => {
              const y = HEAD + r * (CELL + GAP);
              return (
                <g class="row" key={l.id}>
                  <rect class="rowbg" x={0} y={y - 1} width={width} height={CELL + 2} />
                  <circle cx={10} cy={y + CELL / 2} r={4} fill={famColor(l.family)} />
                  <a href={`/lang/${l.id}`}>
                    <text class="rowlab" x={20} y={y + CELL - 3}>{l.name}</text>
                  </a>
                  <text
                    x={LABW - 8}
                    y={y + CELL - 3}
                    text-anchor="end"
                    style="font-family:var(--mono);font-size:10.5px"
                  >
                    {sort === "sim" ? `${Math.round(simTo.get(l.id)! * 100)}%` : l.year}
                  </text>
                  {orderedConcepts.map((c, i) => {
                    const t = l.traits[c.id], col = CATEGORY[c.category].color;
                    const tip = <title>{`${l.name} · ${c.name}\n${detail(l, c.id)}`}</title>;
                    const common = { x: colX[i], y, width: CELL, height: CELL, rx: 2 };
                    if (!t) return <rect key={c.id} class="c none" {...common}>{tip}</rect>;
                    if (t.level === "core") return <rect key={c.id} class="c core" {...common} fill={col}>{tip}</rect>;
                    if (t.level === "supported") {
                      return (
                        <rect key={c.id} class="c supported" {...common} fill={col} fill-opacity=".42">{tip}</rect>
                      );
                    }
                    return (
                      <rect
                        key={c.id}
                        class="c library"
                        {...common}
                        fill="none"
                        stroke={col}
                        stroke-width="1.5"
                        stroke-dasharray="2 2"
                      >
                        {tip}
                      </rect>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
        <aside class="side">
          <h3>Convergent evolution</h3>
          <p>
            Pairs whose traits are the most alike (rare traits count more) even though they are three or more lineage
            steps apart: they arrived at similar designs independently.
          </p>
          <ol class="conv">
            {convergentPairs.map(({ a, b, sim, dist }) => (
              <li key={a.id + b.id}>
                <a href={`/compare?l=${a.id},${b.id}&t=shapes`}>
                  <b>{Math.round(sim * 100)}%</b>
                  {a.name} &amp; {b.name}
                  <small>
                    {a.year} · {b.year} · {dist === undefined ? "no lineage path" : `${dist} lineage steps apart`}
                  </small>
                </a>
              </li>
            ))}
          </ol>
          <h3>Reading the matrix</h3>
          <p>
            Solid = core to the language · half = supported · dashed = library. Hover a cell for details. Click a
            language for its page, or a concept to watch it spread on the River.
          </p>
        </aside>
      </div>
    </section>
  );
});
