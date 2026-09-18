import { useEffect, useState } from "preact/hooks";

type Props = {
  task: string;
  langs: string[];
  tasks: { id: string; name: string }[];
  options: { id: string; name: string; year: number }[];
};

const href = (langs: string[], task: string) => `/compare?l=${langs.join(",")}&t=${task}`;

export default function DeskBar({ task, langs, tasks, options }: Props) {
  const [skins, setSkins] = useState(true);
  useEffect(() => {
    try {
      setSkins(localStorage.getItem("plw.skins") !== "off");
    } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    document.getElementById("desk")?.classList.toggle("skins", skins);
    try {
      localStorage.setItem("plw.skins", skins ? "on" : "off");
    } catch { /* storage unavailable */ }
  }, [skins]);

  return (
    <div class="desk-bar">
      <h2>Rosetta Desk</h2>
      <label class="ctl">
        Task
        <select id="task" onChange={(e) => location.assign(href(langs, e.currentTarget.value))}>
          {tasks.map((t) => <option key={t.id} value={t.id} selected={t.id === task}>{t.name}</option>)}
        </select>
      </label>
      <label class="ctl">
        Add
        <select
          id="addLang"
          onChange={(e) => {
            const id = e.currentTarget.value;
            if (id) location.assign(href([...langs.filter((l) => l !== id), id].slice(-6), task));
          }}
        >
          <option value="">Language…</option>
          {options.filter((o) => !langs.includes(o.id)).map((o) => (
            <option key={o.id} value={o.id}>{o.name} · {o.year}</option>
          ))}
        </select>
      </label>
      <label class="ctl">
        <input id="skins" type="checkbox" checked={skins} onChange={(e) => setSkins(e.currentTarget.checked)} />{" "}
        Period skins
      </label>
      <span class="spacer" />
      <button type="button" class="btn primary" onClick={() => dispatchEvent(new Event("plw:run-all"))}>
        ▶ Run all
      </button>
    </div>
  );
}
