type Props = { sort: string; to: string; options: { id: string; name: string; year: number }[] };

export default function GenomeSort({ sort, to, options }: Props) {
  const go = (s: string, t: string) => location.assign(`/genome?sort=${s}${s === "sim" ? `&to=${t}` : ""}`);
  return (
    <div class="genome-controls">
      <label class="ctl">
        Order by
        <select id="gsort" onChange={(e) => go(e.currentTarget.value, to)}>
          {[["year", "Year"], ["family", "Family"], ["sim", "Similarity to…"], ["count", "Trait count"]].map((
            [v, l],
          ) => <option key={v} value={v} selected={v === sort}>{l}</option>)}
        </select>
      </label>
      {sort === "sim" && (
        <select
          id="gsimTo"
          aria-label="Compare with"
          onChange={(e) => go("sim", e.currentTarget.value)}
        >
          {options.map((o) => <option key={o.id} value={o.id} selected={o.id === to}>{o.name} · {o.year}</option>)}
        </select>
      )}
    </div>
  );
}
