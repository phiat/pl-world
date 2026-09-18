import { HttpError, page } from "fresh";
import { define } from "../../utils.ts";
import { PageHead } from "../../components/PageHead.tsx";
import River from "../../islands/River.tsx";
import CodeWindow from "../../islands/CodeWindow.tsx";
import { LangChip } from "../../components/LangChip.tsx";
import { AdoptionChart } from "../../components/AdoptionChart.tsx";
import { byId, conceptById, languages, tasks } from "../../lib/world.ts";
import { adoptionOf, carriersOf, demonstrations, lineup, taskFor, travelsWith } from "../../lib/concepts.ts";
import { riverEdges, riverNodes } from "../../lib/river.ts";
import { CATEGORY, type ConceptLite } from "../../lib/meta.ts";
import { windowProps } from "../../lib/windows.ts";

export const handler = define.handlers({
  GET(ctx) {
    const concept = conceptById.get(ctx.params.id);
    if (!concept) throw new HttpError(404);
    return page({ concept });
  },
});

const LEVELS = [
  ["core", "core to the language"],
  ["supported", "supported"],
  ["library", "via a library"],
] as const;

export default define.page<typeof handler>(function ConceptPage({ data: { concept: c }, url }) {
  const cat = CATEGORY[c.category];
  const carriers = carriersOf(c.id);
  const count = (level: string) => carriers.filter((x) => x.level === level).length;
  const has = new Set(carriers.map((x) => x.lang.id));
  const absent = languages.filter((l) => !has.has(l.id));
  const origin = c.origin.lang ? byId.get(c.origin.lang) : undefined;
  const originName = origin?.name ?? c.origin.external!;
  const first = carriers[0];
  const latest = carriers.at(-1);

  // Code: snippets tagged as built around this concept; otherwise the origin's and popularizers' take on
  // the task where the concept naturally shows up.
  const task = taskFor(c.id);
  const spreaders = lineup(c).filter((l) => has.has(l.id));
  const tagged = demonstrations(c.id);
  const shown = tagged.length
    ? tagged
    : task
    ? spreaders.filter((l) => l.snippets[task]).slice(0, 2).map((lang) => ({ lang, task }))
    : [];
  const deskTask = task ?? "signature";
  const deskLangs = [...new Set([...shown.map((s) => s.lang.id), ...spreaders.map((l) => l.id)])].slice(0, 5);

  return (
    <section class="wrap concept-page" style={`--lc:${cat.color}`}>
      <PageHead title={c.name} description={c.summary} url={url} />
      <div class="pl-head">
        <a class="eyebrow" href={`/concepts#${c.category}`} style={`color:${cat.color}`}>{cat.label} · concept</a>
        <h2>{c.name}</h2>
        <p class="tag">{c.summary}</p>
      </div>

      <div>
        <div class="pl-sec" style="margin-top:0">
          <h4 class="eyebrow">Adoption</h4>
          <AdoptionChart
            points={adoptionOf(c.id)}
            color={cat.color}
            max={languages.length}
            origin={{ year: c.origin.year, label: `origin: ${originName}` }}
            label={`${c.name}: ${carriers.length} of ${languages.length} languages carry it by ${
              adoptionOf(c.id).at(-1)!.year
            }.`}
          />
          <div class="legend adoption-legend">
            {LEVELS.map(([lv, text]) => (
              <span key={lv}>
                <i class={`sw ${lv}`} style={`--ac:${cat.color}`} /> {text}
              </span>
            ))}
            <span>
              <i class="sw exist" /> languages in existence
            </span>
          </div>
          {first && latest && (
            <p class="note">
              First among these languages: {first.lang.name} ({first.acquired}). Most recent to take it up:{" "}
              {latest.lang.name} ({latest.version ?? latest.acquired}).
            </p>
          )}
        </div>

        <div class="pl-sec">
          <h4 class="eyebrow">In code</h4>
          {shown.length > 0
            ? (
              <div class="desk skins">
                {shown.map(({ lang, task }) => {
                  const props = windowProps(lang, task);
                  return props ? <CodeWindow key={lang.id} {...props} /> : null;
                })}
              </div>
            )
            : <p class="note">No snippet here is built around {c.name.toLowerCase()} yet.</p>}
          {shown.length > 0 && !tagged.length && (
            <p class="note">
              {tasks.find((t) => t.id === task)?.name} as written in {shown.map((s) => s.lang.name).join(" and ")}.
            </p>
          )}
          {deskLangs.length > 0 && (
            <div class="pl-actions">
              <a class="btn" href={`/compare?l=${deskLangs.join(",")}&t=${deskTask}`}>
                Compare {tasks.find((t) => t.id === deskTask)?.name.toLowerCase()} in the Rosetta Desk
              </a>
            </div>
          )}
        </div>
      </div>

      <aside>
        <div class="pl-sec">
          <div class="carrier-count">
            <b>{carriers.length}</b>
            <span>
              of {languages.length} languages carry it
              <small>{LEVELS.map(([lv]) => `${count(lv)} ${lv}`).join(" · ")}</small>
            </span>
          </div>
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Origin · {c.origin.year}</h4>
          <div class="chips">
            {origin
              ? <LangChip id={origin.id} name={origin.name} family={origin.family} extra={String(c.origin.year)} />
              : <span class="chip external">{c.origin.external}</span>}
          </div>
          {c.origin.note && <p class="note">{c.origin.note}</p>}
        </div>
        {c.popularized_by.length > 0 && (
          <div class="pl-sec">
            <h4 class="eyebrow">Popularized by</h4>
            <div class="chips">
              {c.popularized_by.map((id) => byId.get(id)).filter((l) => !!l).map((l) => (
                <LangChip key={l.id} id={l.id} name={l.name} family={l.family} extra={String(l.year)} />
              ))}
            </div>
          </div>
        )}
        <div class="pl-sec">
          <h4 class="eyebrow">Often found with</h4>
          <ul class="with">
            {travelsWith(c.id).map(({ concept: o, both, overlap }) => (
              <li key={o.id} style={`--cc:${CATEGORY[o.category].color}`}>
                <a href={`/concept/${o.id}`}>{o.name}</a>
                <small title={`${both} languages carry both`}>{Math.round(overlap * 100)}%</small>
              </li>
            ))}
          </ul>
          <p class="note">Overlap of the languages that carry each (Jaccard).</p>
        </div>
      </aside>

      <div class="pl-sec wide">
        <h4 class="eyebrow">Spread</h4>
        <p class="note lede">
          Languages that carry {c.name.toLowerCase()} are lit; the rest are faded. Play history to watch it spread.
        </p>
        <River
          nodes={riverNodes(c.id)}
          edges={riverEdges}
          concepts={[c as ConceptLite]}
          initialGene={c.id}
          embedded
        />
      </div>

      <div class="pl-sec wide">
        <h4 class="eyebrow">Carriers, in the order they took it up</h4>
        <ol class="carriers">
          {carriers.map((x) => (
            <li key={x.lang.id} class={x.level}>
              <span class="yr">{x.acquired}</span>
              <LangChip id={x.lang.id} name={x.lang.name} family={x.lang.family} />
              <span class="lvl">
                {x.level}
                {x.acquired > x.lang.year ? ` · added in ${x.version ?? x.acquired}` : ""}
              </span>
              {x.note && <span class="why">{x.note}</span>}
            </li>
          ))}
        </ol>
        {absent.length > 0 && (
          <>
            <h4 class="eyebrow" style="margin-top:22px">Not carried by ({absent.length})</h4>
            <div class="chips absent">
              {absent.map((l) => (
                <LangChip key={l.id} id={l.id} name={l.name} family={l.family} extra={String(l.year)} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
});
