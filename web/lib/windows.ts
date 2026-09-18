// Server-side: build CodeWindow island props for a language × task.
import type { CodeWindowProps } from "../islands/CodeWindow.tsx";
import { highlight } from "./highlight.ts";
import { era } from "./meta.ts";
import type { Language } from "./world.ts";

export function windowProps(l: Language, task: string, extra: Partial<CodeWindowProps> = {}): CodeWindowProps | null {
  const s = l.snippets[task];
  if (!s) return null;
  const t = l.runtime.toolchains.find((t) => t.docker_image) ?? l.runtime.toolchains[0];
  const e = era(l.year);
  return {
    lang: l.id,
    name: l.name,
    year: l.year,
    era: e,
    dialect: s.dialect,
    title: s.title,
    code: s.code,
    html: highlight(s.code, l.id),
    expected: s.expected_output,
    verified: s.verified,
    toolchain: t ? [t.name, t.version].filter(Boolean).join(" ") : "no toolchain",
    ruler: e === "paper" && (l.id === "fortran" || l.id === "cobol"),
    ...extra,
  };
}
