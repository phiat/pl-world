import type { AdoptionPoint } from "../lib/concepts.ts";

type Props = {
  points: AdoptionPoint[];
  color: string;
  /** Scale of the y axis: the size of the data set. */
  max: number;
  origin?: { year: number; label: string };
  label: string;
};

// One flat step per year (a language has a trait from the year it gained it), so the curve reads as counts.
function area(
  xOf: (year: number) => number,
  yOf: (n: number) => number,
  pts: AdoptionPoint[],
  top: number[],
  bottom: number[],
) {
  const edge = (vals: number[]) => vals.flatMap((v, i) => [[xOf(pts[i].year), yOf(v)], [xOf(pts[i].year + 1), yOf(v)]]);
  return "M" + [...edge(top), ...edge(bottom).reverse()].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") +
    "Z";
}

/** Carriers per year, stacked core / supported / library, against the number of languages in existence. */
export function AdoptionChart({ points, color, max, origin, label }: Props) {
  const W = 900, H = 250, L = 34, R = 14, T = 18, B = 26;
  const y0 = points[0].year, y1 = points.at(-1)!.year + 1;
  const xOf = (y: number) => L + ((y - y0) / (y1 - y0)) * (W - L - R);
  const yOf = (n: number) => H - B - (n / max) * (H - T - B);
  const zero = points.map(() => 0);
  const core = points.map((p) => p.core);
  const sup = points.map((p) => p.core + p.supported);
  const lib = points.map((p) => p.core + p.supported + p.library);
  const decades = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
  const ticks = [0, Math.round(max / 2), max];
  return (
    <div class="adoption-scroll">
      <svg class="adoption" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={`--ac:${color}`}>
        {ticks.map((n) => (
          <g key={n}>
            <line class="grid" x1={L} x2={W - R} y1={yOf(n)} y2={yOf(n)} />
            <text class="tick" x={L - 6} y={yOf(n) + 3.5} text-anchor="end">{n}</text>
          </g>
        ))}
        {decades.map((d) => <text key={d} class="tick" x={xOf(d)} y={H - 7} text-anchor="middle">{d}</text>)}
        <path class="exist" d={area(xOf, yOf, points, points.map((p) => p.exist), zero)} />
        <path class="lib" d={area(xOf, yOf, points, lib, sup)} />
        <path class="sup" d={area(xOf, yOf, points, sup, core)} />
        <path class="core" d={area(xOf, yOf, points, core, zero)} />
        {origin && (
          <g class="origin">
            <line x1={xOf(origin.year)} x2={xOf(origin.year)} y1={T - 4} y2={H - B} />
            <text
              x={xOf(origin.year) + (origin.year > 2000 ? -5 : 5)}
              y={T + 6}
              text-anchor={origin.year > 2000 ? "end" : "start"}
            >
              {origin.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/** The same curve as a sparkline: all carriers over languages in existence. */
export function AdoptionSpark({ points, color, max }: { points: AdoptionPoint[]; color: string; max: number }) {
  const W = 120, H = 30;
  const y0 = points[0].year, y1 = points.at(-1)!.year + 1;
  const xOf = (y: number) => ((y - y0) / (y1 - y0)) * W;
  const yOf = (n: number) => H - 1 - (n / max) * (H - 2);
  const zero = points.map(() => 0);
  return (
    <svg class="spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" style={`--ac:${color}`}>
      <path class="exist" d={area(xOf, yOf, points, points.map((p) => p.exist), zero)} />
      <path class="core" d={area(xOf, yOf, points, points.map((p) => p.core + p.supported + p.library), zero)} />
    </svg>
  );
}
