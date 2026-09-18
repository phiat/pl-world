// Runs code for any language in data/languages/ inside a throwaway, locked-down Docker container.
//
// Source goes in over stdin (no bind mounts, so nothing lands on the host filesystem). The container
// runs a generated shell script that writes the source into a tmpfs, runs the toolchain's compile step
// with its output redirected to stderr, then runs the program. Marker lines on stderr tell us where
// container startup ends and where the run phase begins.
import type { Language } from "../data/schema.ts";

export type SandboxOptions = {
  /** Wall-clock limit per run, including compile. */
  timeoutMs: number;
  /** Max bytes kept per stream; the rest is dropped and `truncated` is set. */
  maxOutputBytes: number;
  /** Kill the container once this many bytes of output have been produced in total. */
  killAfterBytes: number;
  /** Max simultaneous containers. */
  concurrency: number;
  memory: string;
  cpus: string;
  pidsLimit: number;
  docker: string;
};

export const DEFAULT_OPTIONS: SandboxOptions = {
  timeoutMs: 90_000,
  maxOutputBytes: 64 * 1024,
  killAfterBytes: 4 * 1024 * 1024,
  concurrency: Math.max(2, Math.floor(navigator.hardwareConcurrency / 2)),
  memory: "1g",
  cpus: "2",
  pidsLimit: 512,
  docker: "docker",
};

export type RunRequest = { lang: string; code: string };

export type RunResult = {
  lang: string;
  image: string;
  toolchain: string;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  /** Container start → compile start. */
  startup_ms: number | null;
  compile_ms: number | null;
  run_ms: number | null;
  total_ms: number;
  timed_out: boolean;
  truncated: boolean;
  /** Where a non-zero exit happened. */
  failed_phase: "compile" | "run" | "sandbox" | null;
};

export type RunEvent =
  | { type: "start"; image: string; toolchain: string; command: string }
  | { type: "phase"; phase: "compile" | "run" }
  | { type: "stdout" | "stderr"; data: string }
  | { type: "exit"; result: RunResult };

export type Plan = { image: string; toolchain: string; filename: string; command: string; script: string };

// Compilers that insist the file is named after the unit it contains.
const SOURCE_NAMES: Record<string, (code: string) => string | undefined> = {
  ada: (c) => c.match(/^procedure\s+(\w+)\s+is/im)?.[1].toLowerCase().concat(".adb"),
  modula2: (c) => c.match(/^\s*MODULE\s+(\w+)/m)?.[1].concat(".mod"),
  java: () => "Main.java",
  // `dotnet fsi` only runs scripts with the .fsx extension.
  fsharp: () => "main.fsx",
  // gfortran picks fixed vs free form from the extension.
  fortran: (c) => (isFixedFormFortran(c) ? "main.f" : "main.f90"),
};

/** Fixed form: every non-blank line is a column-1 comment or keeps columns 1–5 for statement labels. */
export function isFixedFormFortran(code: string): boolean {
  const lines = code.split("\n").filter((l) => l.trim());
  return lines.length > 0 && lines.every((l) => /^[Cc*!]/.test(l) || /^[ 0-9]{5}/.test(l));
}

const MARK = "\x1ePLW:";

export class UnknownLanguageError extends Error {}

export class Sandbox {
  #langs: Map<string, Language>;
  #opts: SandboxOptions;
  #active = 0;
  #queue: (() => void)[] = [];

  constructor(languages: Language[], opts: Partial<SandboxOptions> = {}) {
    this.#langs = new Map(languages.map((l) => [l.id, l]));
    this.#opts = { ...DEFAULT_OPTIONS, ...opts };
  }

  get options(): Readonly<SandboxOptions> {
    return this.#opts;
  }

  languages(): Language[] {
    return [...this.#langs.values()];
  }

  plan(lang: string, code: string): Plan {
    const l = this.#langs.get(lang);
    const t = l?.runtime.toolchains.find((t) => t.docker_image);
    if (!l || !t?.docker_image) throw new UnknownLanguageError(`no sandbox toolchain for "${lang}"`);
    const filename = SOURCE_NAMES[lang]?.(code) ?? `main${l.file_extensions[0] ?? ".txt"}`;
    // cwd is /src and /src is on PATH, so {out} works both as a file name and as a command.
    const sub = (s: string) => s.replaceAll("{file}", filename).replaceAll("{out}", "prog");
    const compile = t.compile ? sub(t.compile) : null;
    const run = sub(t.run);
    const script = [
      `printf '${MARK}ready\\n' >&2`,
      `cd /src || exit 125`,
      `export PATH="/src:$PATH"`,
      `cat > '${filename}'`,
      compile ? `{ ${compile}\n} >&2 || { rc=$?; printf '${MARK}compile-failed\\n' >&2; exit $rc; }` : "",
      `printf '${MARK}run\\n' >&2`,
      `${run} </dev/null`,
    ].filter(Boolean).join("\n");
    return {
      image: t.docker_image,
      toolchain: [t.name, t.version].filter(Boolean).join(" "),
      filename,
      command: [compile, run].filter(Boolean).join(" && "),
      script,
    };
  }

  dockerArgs(plan: Plan, name: string): string[] {
    const o = this.#opts;
    return [
      "run",
      "--rm",
      "-i",
      "--pull",
      "never",
      "--name",
      name,
      "--label",
      "plw.run=1",
      "--network",
      "none",
      "--memory",
      o.memory,
      "--memory-swap",
      o.memory,
      "--cpus",
      o.cpus,
      "--pids-limit",
      String(o.pidsLimit),
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--tmpfs",
      "/src:rw,exec,size=256m,mode=1777",
      "--tmpfs",
      "/tmp:rw,exec,size=256m,mode=1777",
      "--entrypoint",
      "/bin/sh",
      plan.image,
      "-c",
      plan.script,
    ];
  }

  /** Runs one request. `onEvent` receives a live stream; the resolved value is the final result. */
  async run(req: RunRequest, onEvent?: (e: RunEvent) => void, signal?: AbortSignal): Promise<RunResult> {
    const plan = this.plan(req.lang, req.code);
    await this.#acquire();
    try {
      return await this.#exec(req, plan, onEvent ?? (() => {}), signal);
    } finally {
      this.#release();
    }
  }

  async #exec(req: RunRequest, plan: Plan, emit: (e: RunEvent) => void, signal?: AbortSignal): Promise<RunResult> {
    const o = this.#opts;
    const name = `plw-run-${crypto.randomUUID().slice(0, 12)}`;
    const t0 = performance.now();
    let tReady: number | null = null, tRun: number | null = null;
    let phase: "compile" | "run" | null = null;
    let timedOut = false, truncated = false, killed = false, total = 0;
    const out = { stdout: "", stderr: "" };

    emit({ type: "start", image: plan.image, toolchain: plan.toolchain, command: plan.command });
    const child = new Deno.Command(o.docker, {
      args: this.dockerArgs(plan, name),
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    }).spawn();

    const kill = () => {
      if (killed) return;
      killed = true;
      new Deno.Command(o.docker, { args: ["kill", name], stdout: "null", stderr: "null" }).output().catch(() => {});
    };
    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, o.timeoutMs);
    signal?.addEventListener("abort", kill, { once: true });

    const keep = (stream: "stdout" | "stderr", text: string) => {
      if (!text) return;
      total += text.length;
      if (total > o.killAfterBytes) kill();
      const room = o.maxOutputBytes - out[stream].length;
      if (room <= 0) {
        truncated = true;
        return;
      }
      const kept = text.length > room ? text.slice(0, room) : text;
      if (kept.length < text.length) truncated = true;
      out[stream] += kept;
      emit({ type: stream, data: kept });
    };
    const onMarker = (m: string) => {
      if (m === "ready") {
        tReady = performance.now();
        phase = "compile";
        emit({ type: "phase", phase: "compile" });
      } else if (m === "run") {
        tRun = performance.now();
        phase = "run";
        emit({ type: "phase", phase: "run" });
      } else if (m === "compile-failed") phase = "compile";
    };

    const pump = async (stream: "stdout" | "stderr", body: ReadableStream<Uint8Array>) => {
      let pending = "";
      for await (const chunk of body.pipeThrough(new TextDecoderStream())) {
        if (stream === "stdout") {
          keep("stdout", chunk);
          continue;
        }
        // stderr: strip marker lines, which may be split across chunks
        let s = pending + chunk;
        pending = "";
        for (let i = s.indexOf("\x1e"); i >= 0; i = s.indexOf("\x1e")) {
          keep("stderr", s.slice(0, i));
          const nl = s.indexOf("\n", i);
          if (nl < 0) {
            pending = s.slice(i);
            s = "";
            break;
          }
          const line = s.slice(i, nl);
          if (line.startsWith(MARK)) onMarker(line.slice(MARK.length));
          else keep("stderr", line + "\n");
          s = s.slice(nl + 1);
        }
        keep("stderr", s);
      }
      if (pending) keep("stderr", pending);
    };

    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(req.code)).catch(() => {});
    await writer.close().catch(() => {});
    const [status] = await Promise.all([child.status, pump("stdout", child.stdout), pump("stderr", child.stderr)]);
    clearTimeout(timer);
    const tEnd = performance.now();

    const ms = (a: number | null, b: number | null) => (a !== null && b !== null ? Math.round(b - a) : null);
    const exit = timedOut || killed ? null : status.code;
    const result: RunResult = {
      lang: req.lang,
      image: plan.image,
      toolchain: plan.toolchain,
      exit_code: exit,
      stdout: out.stdout,
      stderr: out.stderr,
      startup_ms: ms(t0, tReady),
      compile_ms: ms(tReady, tRun),
      run_ms: ms(tRun, tEnd),
      total_ms: Math.round(tEnd - t0),
      timed_out: timedOut,
      truncated,
      // No "ready" marker means the container never started (e.g. image missing).
      failed_phase: exit === 0 ? null : phase ?? "sandbox",
    };
    emit({ type: "exit", result });
    return result;
  }

  #acquire(): Promise<void> {
    if (this.#active < this.#opts.concurrency) {
      this.#active++;
      return Promise.resolve();
    }
    return new Promise((resolve) =>
      this.#queue.push(() => {
        this.#active++;
        resolve();
      })
    );
  }

  #release() {
    this.#active--;
    this.#queue.shift()?.();
  }
}

/** Images present locally, as "repo:tag" (tag defaults to latest). */
export async function localImages(docker = "docker"): Promise<Set<string>> {
  const { stdout, success } = await new Deno.Command(docker, {
    args: ["images", "--format", "{{.Repository}}:{{.Tag}}"],
    stdout: "piped",
    stderr: "null",
  }).output();
  if (!success) return new Set();
  return new Set(new TextDecoder().decode(stdout).split("\n").filter(Boolean));
}

export const withTag = (image: string) => (/:[^/]+$/.test(image) ? image : `${image}:latest`);

export const normalizeOutput = (s: string) => s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trimEnd();
