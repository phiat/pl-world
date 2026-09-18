import { useEffect, useRef, useState } from "preact/hooks";
import { type Era, normalizeOutput } from "../lib/meta.ts";
import type { EditorHandle } from "../lib/editor.ts";

export type CodeWindowProps = {
  lang: string;
  name: string;
  year: number;
  era: Era;
  dialect: string;
  title?: string;
  code: string;
  /** Server-highlighted HTML for `code`. */
  html: string;
  expected: string;
  verified: boolean;
  toolchain: string;
  /** Show the Fortran/COBOL card-column ruler. */
  ruler?: boolean;
  /** Language switcher: options and a URL template containing {id}. */
  switcher?: { options: { id: string; name: string; year: number }[]; href: string };
  closeHref?: string;
};

type RunResult = {
  exit_code: number | null;
  stdout: string;
  stderr: string;
  compile_ms: number | null;
  run_ms: number | null;
  total_ms: number;
  timed_out: boolean;
  truncated: boolean;
  failed_phase: "compile" | "run" | "sandbox" | null;
  toolchain: string;
};

type Run =
  | { state: "idle" }
  | { state: "running"; phase: "starting" | "compiling" | "running"; command?: string; stdout: string; stderr: string }
  | { state: "done"; command?: string; result: RunResult; code: string }
  | { state: "error"; message: string };

const RULER = "         1         2         3         4         5         6         7\n" +
  "1...5.7....0....5....0....5....0....5....0....5....0....5....0....5....0..";

const MATCHES = " · ✓ matches expected output", DIFFERS = " · ✗ differs from expected output";

const secs = (ms: number | null) => (ms === null ? "" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

export default function CodeWindow(p: CodeWindowProps) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(p.code);
  const [run, setRun] = useState<Run>({ state: "idle" });
  const [editorReady, setEditorReady] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorHandle | null>(null);
  const codeRef = useRef(code);
  codeRef.current = code;
  const edited = code !== p.code;
  const open = editing || edited;

  async function start() {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    const source = codeRef.current;
    let command: string | undefined, stdout = "", stderr = "";
    let phase: "starting" | "compiling" | "running" = "starting";
    setRun({ state: "running", phase, stdout, stderr });
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "text/event-stream" },
        body: JSON.stringify({ lang: p.lang, code: source }),
        signal: ctl.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        setRun({ state: "error", message: body.error ?? `The runner answered ${res.status}.` });
        return;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        let cut;
        while ((cut = buf.indexOf("\n\n")) >= 0) {
          const block = buf.slice(0, cut);
          buf = buf.slice(cut + 2);
          const event = block.match(/^event: (.*)$/m)?.[1];
          const data = JSON.parse(block.match(/^data: (.*)$/m)?.[1] ?? "null");
          if (event === "start") command = data.command;
          else if (event === "phase") phase = data.phase === "run" ? "running" : "compiling";
          else if (event === "stdout") stdout += data.data;
          else if (event === "stderr") stderr += data.data;
          else if (event === "exit") {
            setRun({ state: "done", command, result: data.result, code: source });
            return;
          } else if (event === "error") {
            setRun({ state: "error", message: data.message });
            return;
          }
          setRun({ state: "running", phase, command, stdout, stderr });
        }
      }
      setRun({ state: "error", message: "The run ended without a result." });
    } catch (e) {
      if (!ctl.signal.aborted) setRun({ state: "error", message: String(e) });
    }
  }

  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    const onRunAll = () => startRef.current();
    addEventListener("plw:run-all", onRunAll);
    return () => {
      removeEventListener("plw:run-all", onRunAll);
      abort.current?.abort();
      editor.current?.destroy();
    };
  }, []);

  // CodeMirror is mounted while the window is being edited or holds edited code (read-only after Done),
  // and dropped on Reset. The editor module is fetched the first time any window needs it.
  useEffect(() => {
    if (!open) {
      editor.current?.destroy();
      editor.current = null;
      setEditorReady(false);
      return;
    }
    if (editor.current) {
      editor.current.setReadOnly(!editing);
      if (editing) editor.current.focus();
      return;
    }
    let live = true;
    import("../lib/editor.ts")
      .then(({ createEditor }) =>
        createEditor(host.current!, {
          doc: codeRef.current,
          lang: p.lang,
          label: `${p.name} source`,
          readOnly: !editing,
          onChange: setCode,
          onRun: () => startRef.current(),
        })
      )
      .then((h) => {
        if (!live) return h.destroy();
        editor.current = h;
        setEditorReady(true); // focus follows in the effect below, once the host is visible
      })
      .catch((e) => {
        console.error(e);
        if (!live) return;
        setEditing(false);
        setRun({ state: "error", message: "The editor failed to load." });
      });
    return () => {
      live = false;
    };
  }, [open, editing]);

  useEffect(() => {
    if (editorReady && editing) editor.current?.focus();
  }, [editorReady]);

  return (
    <article class="win" data-era={p.era}>
      <div class="win-bar">
        {p.closeHref && <a class="x" href={p.closeHref} aria-label={`Close ${p.name} window`}>×</a>}
        {p.switcher
          ? (
            <select
              aria-label="Language"
              onChange={(e) => location.assign(p.switcher!.href.replace("{id}", e.currentTarget.value))}
            >
              {p.switcher.options.map((o) => (
                <option key={o.id} value={o.id} selected={o.id === p.lang}>{o.name} · {o.year}</option>
              ))}
            </select>
          )
          : <span class="win-name">{p.name}</span>}
        {!p.switcher && <span class="yr">{p.year}</span>}
        <button type="button" onClick={() => setEditing(!editing)}>{editing ? "Done" : "Edit"}</button>
        {edited && (
          <button
            type="button"
            onClick={() => {
              setCode(p.code);
              setEditing(false);
            }}
          >
            Reset
          </button>
        )}
        <button type="button" class="run" onClick={start} disabled={run.state === "running"}>
          {run.state === "running" ? "…" : "▶ Run"}
        </button>
      </div>
      <div class="win-body">
        {p.ruler && <div class="win-ruler">{RULER}</div>}
        {p.title && <div class="win-ruler" style="opacity:.85;font-weight:600">{p.title}</div>}
        {open && <div ref={host} class="win-code win-cm" hidden={!editorReady} />}
        {!(open && editorReady) && (
          // p.html comes from lib/highlight.ts on the server, which escapes the (repo-owned) source.
          // deno-lint-ignore react-no-danger
          <pre class="win-code" dangerouslySetInnerHTML={{ __html: p.html }} />
        )}
      </div>
      {run.state !== "idle" && <Output run={run} expected={edited ? null : p.expected} />}
      <div class="win-foot">
        {p.dialect} · {p.toolchain}
        {edited ? " · edited" : p.verified ? " · ✓ verified" : " · unverified"}
      </div>
    </article>
  );
}

function Output({ run, expected }: { run: Run; expected: string | null }) {
  if (run.state === "error") {
    return (
      <div class="win-out">
        <div class="status bad">{run.message}</div>
      </div>
    );
  }
  if (run.state === "running") {
    const label = { starting: "starting container…", compiling: "compiling…", running: "running…" }[run.phase];
    return (
      <div class="win-out">
        {run.command && <div class="cmd">$ {run.command}</div>}
        {run.stdout && <pre>{run.stdout}</pre>}
        {run.stderr && <pre class="err">{run.stderr}</pre>}
        <div class="status">{label}</div>
      </div>
    );
  }
  if (run.state !== "done") return null;
  const r = run.result;
  const matches = expected !== null && r.exit_code === 0 && normalizeOutput(r.stdout) === normalizeOutput(expected);
  const summary = r.timed_out
    ? "timed out"
    : r.exit_code === 0
    ? `exit 0`
    : r.failed_phase === "compile"
    ? `compile failed (exit ${r.exit_code})`
    : `exit ${r.exit_code ?? "?"}`;
  return (
    <div class="win-out">
      {run.command && <div class="cmd">$ {run.command}</div>}
      {r.stdout && <pre>{r.stdout}</pre>}
      {r.stderr && <pre class="err">{r.stderr}</pre>}
      <div class="status">
        {summary}
        {r.compile_ms !== null && r.compile_ms > 50 ? ` · compile ${secs(r.compile_ms)}` : ""}
        {r.run_ms !== null ? ` · run ${secs(r.run_ms)}` : ""} · total {secs(r.total_ms)}
        {r.truncated ? " · output truncated" : ""}
        {expected !== null && (matches ? <span class="ok">{MATCHES}</span> : <span class="bad">{DIFFERS}</span>)}
      </div>
    </div>
  );
}
