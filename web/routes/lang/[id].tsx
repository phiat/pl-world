import { HttpError, page } from "fresh";
import { define } from "../../utils.ts";
import CodeWindow from "../../islands/CodeWindow.tsx";
import { DnaStrip } from "../../components/DnaStrip.tsx";
import { LangChip } from "../../components/LangChip.tsx";
import {
  byId,
  childrenOf,
  closestByTraits,
  concepts,
  type Language,
  laterInfluencesOf,
  parentsOf,
  tasks,
} from "../../lib/world.ts";
import { type ConceptLite, famColor, FAMILY, type TraitLite } from "../../lib/meta.ts";
import { windowProps } from "../../lib/windows.ts";

export const handler = define.handlers({
  GET(ctx) {
    const lang = byId.get(ctx.params.id);
    if (!lang) throw new HttpError(404);
    const task = lang.snippets[ctx.url.searchParams.get("task") ?? ""] ? ctx.url.searchParams.get("task")! : "hello";
    return page({ lang, task });
  },
});

const chip = (id: string, extra?: string) => {
  const l = byId.get(id)!;
  return <LangChip key={id} id={id} name={l.name} family={l.family} extra={extra} />;
};

export default define.page<typeof handler>(function LanguagePage({ data: { lang: l, task } }) {
  const parents = parentsOf(l.id).sort((a, b) => (a.weight > b.weight ? 1 : -1));
  const kids = childrenOf(l.id).sort((a, b) => byId.get(a.child)!.year - byId.get(b.child)!.year);
  const later = laterInfluencesOf(l.id);
  const win = windowProps(l, task);
  const t0 = l.runtime.toolchains[0];
  return (
    <section class="wrap lang-page" style={`--lc:${famColor(l.family)}`}>
      <title>{`${l.name} · PL World`}</title>
      <div class="pl-head">
        <span class="eyebrow">{FAMILY[l.family]?.label} family · {l.year}</span>
        <h2>
          {l.name}
          <span class="status">{l.status}</span>
        </h2>
        <div class="who">{l.designers.join(", ")}{l.organization ? ` · ${l.organization}` : ""}</div>
        <p class="tag">{l.tagline}</p>
      </div>

      <div>
        <div class="pl-sec" style="margin-top:0">
          <h4 class="eyebrow">Trait DNA</h4>
          <DnaStrip traits={l.traits as Record<string, TraitLite>} concepts={concepts as ConceptLite[]} />
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Code</h4>
          <div class="tabs" role="tablist">
            {tasks.filter((t) => l.snippets[t.id]).map((t) => (
              <a key={t.id} role="tab" href={`/lang/${l.id}?task=${t.id}`} aria-selected={t.id === task}>
                {t.id === "signature" ? "★ " : ""}
                {t.name}
              </a>
            ))}
          </div>
          <div class="skins">{win && <CodeWindow key={task} {...win} />}</div>
          {l.snippets[task]?.notes && <p class="note" style="margin:6px 0 0">{l.snippets[task].notes}</p>}
          <div class="pl-actions">
            <a class="btn primary" href={`/compare?add=${l.id}&t=${task}`}>Open in Rosetta Desk</a>
            <a class="btn" href={`/?gene=`}>Back to the River</a>
          </div>
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">History</h4>
          <div class="prose">{l.history.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Innovations</h4>
          <ul class="innov">{l.innovations.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
        {l.trivia?.length
          ? (
            <div class="pl-sec">
              <h4 class="eyebrow">Trivia</h4>
              <ul class="innov">{l.trivia.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )
          : null}
      </div>

      <aside>
        <div class="pl-sec">
          <dl class="facts">
            <dt>Paradigms</dt>
            <dd>{l.paradigms.join(", ")}</dd>
            <dt>Typing</dt>
            <dd>
              {[
                l.typing.discipline,
                l.typing.strength,
                l.typing.inference !== "none" ? `${l.typing.inference} inference` : "",
              ]
                .filter(Boolean).join(", ")}
            </dd>
            <dt>Memory</dt>
            <dd>{l.memory}</dd>
            <dt>Runs as</dt>
            <dd>{l.execution.join(", ")}</dd>
            <dt>Syntax</dt>
            <dd>{l.syntax_family} · {l.block_style}</dd>
            {l.latest_version && (
              <>
                <dt>Latest</dt>
                <dd>{l.latest_version}</dd>
              </>
            )}
          </dl>
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Parents</h4>
          <div class="chips">
            {parents.length ? parents.map((e) => chip(e.parent, e.kind)) : <span class="note">A root of the tree</span>}
          </div>
          {l.influenced_by_external.length > 0 && (
            <p class="note" style="margin:8px 0 0">
              Also: {l.influenced_by_external.map((x) => x.name + (x.year ? ` (${x.year})` : "")).join(", ")}
            </p>
          )}
        </div>
        {later.length > 0 && (
          <div class="pl-sec">
            <h4 class="eyebrow">Later borrowed from</h4>
            <div class="chips">{later.map((e) => chip(e.parent, String(byId.get(e.parent)!.year)))}</div>
          </div>
        )}
        <div class="pl-sec">
          <h4 class="eyebrow">Children</h4>
          <div class="chips">
            {kids.length
              ? kids.map((e) => chip(e.child, String(byId.get(e.child)!.year)))
              : <span class="note">None among these 50</span>}
          </div>
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Closest by traits</h4>
          {closestByTraits(l.id).map(({ lang: o, sim, dist }) => (
            <div class="sim-row" key={o.id}>
              <span>{chip(o.id)}</span>
              <small>
                {Math.round(sim * 100)}% · {dist === undefined
                  ? "unrelated"
                  : dist <= 2
                  ? `relative (${dist} step${dist > 1 ? "s" : ""})`
                  : `convergent (${dist} steps)`}
              </small>
            </div>
          ))}
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Milestones</h4>
          <ul class="miles">
            {l.milestones.map((m, i) => (
              <li key={i}>
                <b>{m.year}</b>
                <span>{m.event}</span>
              </li>
            ))}
          </ul>
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Runs on</h4>
          <p class="note" style="margin:0">
            {t0 ? [t0.name, t0.version].filter(Boolean).join(" ") : "No toolchain"}
            {t0?.docker_image && (
              <>
                · <code>{t0.docker_image}</code>
              </>
            )}
            {l.runtime.browser && <>· in-browser: {l.runtime.browser.name}</>}
          </p>
        </div>
        <div class="pl-sec">
          <h4 class="eyebrow">Sources</h4>
          <p class="note" style="margin:0;word-break:break-all">
            {l.sources.map((u) => (
              <span key={u}>
                <a href={u} rel="noreferrer">{u}</a>
                <br />
              </span>
            ))}
          </p>
        </div>
      </aside>
    </section>
  );
});

export type { Language };
