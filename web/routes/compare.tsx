import { define } from "../utils.ts";
import DeskBar from "../islands/DeskBar.tsx";
import CodeWindow from "../islands/CodeWindow.tsx";
import { PageHead } from "../components/PageHead.tsx";
import { byId, languages, orderedConcepts, tasks } from "../lib/world.ts";
import { CATEGORY, famColor, REPO_URL } from "../lib/meta.ts";
import { RUNNER_URL } from "../lib/runner.ts";
import { windowProps } from "../lib/windows.ts";

const DEFAULT_LANGS = ["fortran", "c", "erlang", "haskell", "rust"];
const options = languages.map((l) => ({ id: l.id, name: l.name, year: l.year }));

export default define.page(function Compare({ url }) {
  const q = url.searchParams;
  const task = tasks.some((t) => t.id === q.get("t")) ? q.get("t")! : "factorial";
  let langs = (q.get("l")?.split(",") ?? DEFAULT_LANGS).filter((id) => byId.has(id));
  const add = q.get("add");
  if (add && byId.has(add) && !langs.includes(add)) langs = [...langs, add].slice(-6);
  const t = tasks.find((x) => x.id === task)!;
  const href = (ls: string[]) => `/compare?l=${ls.join(",")}&t=${task}`;

  const ls = langs.map((id) => byId.get(id)!);
  const has = (id: string, c: string) => !!byId.get(id)!.traits[c];
  const shared = orderedConcepts.filter((c) => langs.length > 1 && langs.every((id) => has(id, c.id)));
  const pill = (c: (typeof orderedConcepts)[number]) => (
    <span key={c.id} class="pill" style={`--pc:${CATEGORY[c.category].color}`} title={c.summary}>{c.name}</span>
  );

  return (
    <section class="wrap">
      <PageHead
        title={`Rosetta Desk: ${t.name} in ${ls.map((l) => l.name).join(", ")}`}
        description={`The same program in ${ls.length} languages side by side, each runnable on its real toolchain. ${t.prompt}`}
        url={url}
      />
      <DeskBar task={task} langs={langs} tasks={tasks.map((x) => ({ id: x.id, name: x.name }))} options={options} />
      <p class="note">{t.prompt} Shows: {t.shows}</p>
      <div id="desk" class="desk skins">
        {ls.map((l) => {
          const props = windowProps(l, task, {
            closeHref: href(langs.filter((x) => x !== l.id)),
            switcher: { options, href: href(langs.map((x) => (x === l.id ? "{id}" : x))) },
          });
          return props ? <CodeWindow key={l.id} {...props} /> : null;
        })}
      </div>
      <div class="diff">
        <span class="eyebrow">Trait diff</span>
        {langs.length < 2 ? <p class="note" style="margin:0">Add another language to compare traits.</p> : (
          <>
            <div class="diff-row">
              <div class="who">Shared by all</div>
              <div>
                {shared.length ? shared.map(pill) : <span class="note">Nothing in common, which is the point.</span>}
              </div>
            </div>
            {ls.map((l) => {
              const only = orderedConcepts.filter((c) =>
                has(l.id, c.id) && langs.every((o) => o === l.id || !has(o, c.id))
              );
              return (
                <div class="diff-row" key={l.id}>
                  <div class="who">
                    <i style={`background:${famColor(l.family)}`} />Only {l.name}
                  </div>
                  <div>{only.length ? only.map(pill) : <span class="note">—</span>}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <p class="note" style="padding-block: 12px 32px">
        {RUNNER_URL
          ? (
            <>
              Runs go to the sandbox runner: a fresh, network-less container per run. Edit any window and press Run
              (Ctrl/⌘+Enter while editing). Start the runner with <code>deno task runner</code>.
            </>
          )
          : (
            <>
              Run shows each snippet's recorded output, verified on its real toolchain. To run edited code,{" "}
              <a href={REPO_URL}>clone the repo</a> and start the local sandbox with <code>deno task dev</code>.
            </>
          )}
      </p>
    </section>
  );
});
