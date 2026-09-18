// Server-side syntax highlighting. Languages without a highlight.js grammar render as plain text.
import hljs from "highlight.js";

const GRAMMAR: Record<string, string> = {
  fortran: "fortran",
  lisp: "lisp",
  basic: "basic",
  b: "c",
  pascal: "delphi",
  modula2: "delphi",
  c: "c",
  smalltalk: "smalltalk",
  self: "smalltalk",
  prolog: "prolog",
  ml: "sml",
  sql: "sql",
  scheme: "scheme",
  ada: "ada",
  "objective-c": "objectivec",
  "common-lisp": "lisp",
  cpp: "cpp",
  miranda: "haskell",
  erlang: "erlang",
  perl: "perl",
  haskell: "haskell",
  python: "python",
  lua: "lua",
  r: "r",
  java: "java",
  javascript: "javascript",
  ruby: "ruby",
  php: "php",
  ocaml: "ocaml",
  csharp: "csharp",
  scala: "scala",
  fsharp: "fsharp",
  clojure: "clojure",
  go: "go",
  rust: "rust",
  kotlin: "kotlin",
  elixir: "elixir",
  julia: "julia",
  typescript: "typescript",
  swift: "swift",
};

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/** Returns safe HTML for `code` (hljs escapes its input). */
export function highlight(code: string, langId: string): string {
  const grammar = GRAMMAR[langId];
  if (grammar && hljs.getLanguage(grammar)) {
    return hljs.highlight(code, { language: grammar, ignoreIllegals: true }).value;
  }
  return escape(code);
}
