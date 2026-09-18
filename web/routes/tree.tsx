import { define } from "../utils.ts";
import GenealogyChart from "../islands/GenealogyChart.tsx";
import NavSelect from "../islands/NavSelect.tsx";
import { LangChip } from "../components/LangChip.tsx";
import { byId, type Edge, languages } from "../lib/world.ts";
import { pedigree, type PedigreeCard, tree, web } from "../lib/genealogy.ts";
import { famColor, FAMILY } from "../lib/meta.ts";

const options = languages.map((l) => ({ value: l.id, label: `${l.name} · ${l.year}` }));
const rootNames = tree.roots.map((id) => byId.get(id)!.name);

const KINDS = [
  ["successor", "2.2", ""],
  ["superset", "3.2", ""],
  ["dialect", "1.8", ""],
  ["influence", "1.2", "5 3"],
  ["platform", "2", "1 3"],
] as const;

export default define.page(function Genealogy({ url }) {
  const q = url.searchParams;
  const of = q.get("of");
  const focus = of && byId.has(of) ? of : null;
  const view = focus ? "pedigree" : q.get("view") === "web" ? "web" : "tree";
  const all = q.get("all") === "1";
  const ped = focus ? pedigree(focus, all) : null;
  const l = focus ? byId.get(focus)! : null;

  return (
    <section class="wrap genealogy">
      <title>{l ? `${l.name} pedigree · PL World` : "Genealogy · PL World"}</title>
      <div class="desk-bar">
        <h2>Genealogy</h2>
        <nav aria-label="Layout">
          <a href="/tree" aria-current={view === "tree" ? "page" : undefined}>Family tree</a>
          <a href="/tree?view=web" aria-current={view === "web" ? "page" : undefined}>Influence web</a>
          <a href={`/tree?of=${focus ?? "c"}`} aria-current={view === "pedigree" ? "page" : undefined}>Pedigree</a>
        </nav>
        <NavSelect
          label="Pedigree of"
          value={focus ?? ""}
          placeholder="Language…"
          options={options}
          href="/tree?of={v}"
        />
        {ped && (
          <a class="btn" href={`/tree?of=${focus}${all ? "" : "&all=1"}`}>
            {all ? "Major lines only" : "Show every line"}
          </a>
        )}
      </div>

      {view === "tree" && (
        <p class="note lede">
          Each language hangs from its <b>primary parent</b>, the one it most directly descends from, on a time axis.
          {" "}
          {rootNames.length} have no parent among these 50:{" "}
          {rootNames.join(", ")}. Hover to trace a line of descent; click for a pedigree.
        </p>
      )}
      {view === "web" && (
        <p class="note lede">
          All {web.edges.length}{" "}
          lineage links, laid out in layers so influence flows from top to bottom. Faint lines are minor influences.
          Hover to trace every ancestor and descendant; click for a pedigree.
        </p>
      )}

      {view !== "pedigree" && (
        <div class="gchart-scroll">
          <GenealogyChart mode={view} chart={view === "tree" ? tree : web} />
        </div>
      )}

      {ped && l && (
        <>
          <p class="note lede">
            Ancestors of <b>{l.name}</b>{" "}
            ({l.year}) to the left, three generations back; descendants to the right, two generations on. {all
              ? "Every lineage line is followed."
              : "Direct parents and children include minor influences; further out, only major lines are followed."}
            {" "}
            Click a card to walk the tree.
          </p>
          <div class="gchart-scroll">
            <div class="pedigree" style={`width:${ped.width}px;height:${ped.height}px`}>
              <svg class="gchart" width={ped.width} height={ped.height} aria-hidden="true">
                {ped.edges.map((e) => (
                  <path key={`${e.parent}>${e.child}`} class={`edge k-${e.kind} ${e.weight}`} d={e.d} />
                ))}
              </svg>
              {ped.cards.map((c) => <Card key={c.id} c={c} focus={c.id === focus} all={all} />)}
            </div>
          </div>
          <div class="relations">
            <Relations title={`What ${l.name} inherited`} edges={ped.parents} side="parent" />
            <Relations title={`What ${l.name} passed on`} edges={ped.children} side="child" />
          </div>
        </>
      )}

      <div class="legend">
        {KINDS.map(([k, w, dash]) => (
          <span key={k}>
            <svg width="34" height="8" aria-hidden="true">
              <line x1="1" y1="4" x2="33" y2="4" stroke="currentColor" stroke-width={w} stroke-dasharray={dash} />
            </svg>{" "}
            {k}
          </span>
        ))}
        <span>
          <svg width="34" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="33" y2="4" stroke="currentColor" stroke-width="1.2" opacity=".35" />
          </svg>{" "}
          minor
        </span>
        <span>
          <svg width="34" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="33" y2="4" stroke="var(--anc)" stroke-width="2" />
          </svg>{" "}
          ancestors
        </span>
        <span>
          <svg width="34" height="8" aria-hidden="true">
            <line x1="1" y1="4" x2="33" y2="4" stroke="var(--desc)" stroke-width="2" />
          </svg>{" "}
          descendants
        </span>
      </div>
    </section>
  );
});

function Card({ c, focus, all }: { c: PedigreeCard; focus: boolean; all: boolean }) {
  const href = focus ? `/lang/${c.id}` : `/tree?of=${c.id}${all ? "&all=1" : ""}`;
  const where = c.gen < 0 ? "anc" : c.gen > 0 ? "desc" : "focus";
  return (
    <a
      class={`pcard ${where}${c.minor ? " minor" : ""}${c.historical ? " historical" : ""}`}
      href={href}
      style={`left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;--fc:${famColor(c.family)}`}
      title={`${c.name} · ${c.year} — ${c.tagline}${focus ? " (open its page)" : ""}`}
    >
      <b>{c.name}</b>
      <small>
        {c.year} ·{" "}
        {focus ? "open its page →" : c.relation ? `${c.minor ? "minor " : ""}${c.relation}` : FAMILY[c.family]?.label}
      </small>
    </a>
  );
}

function Relations({ title, edges, side }: { title: string; edges: Edge[]; side: "parent" | "child" }) {
  return (
    <div>
      <h3 class="eyebrow">{title}</h3>
      {edges.length === 0 && <p class="note">Nothing among these 50 languages.</p>}
      <ul>
        {edges.map((e) => {
          const other = byId.get(side === "parent" ? e.parent : e.child)!;
          return (
            <li key={other.id} class={e.weight}>
              <LangChip id={other.id} name={other.name} family={other.family} extra={String(other.year)} />
              <span class="kind">{e.kind}{e.weight === "minor" ? " · minor" : ""}</span>
              {e.note && <span class="why">{e.note}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
