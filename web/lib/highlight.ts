// Server-side syntax highlighting. Languages without a highlight.js grammar render as plain text.
// Only the grammars below are bundled (the full highlight.js build carries ~190 and weighs ~1 MB).
import hljs from "highlight.js/lib/core";
import type { LanguageFn } from "highlight.js";
import ada from "highlight.js/lib/languages/ada";
import awk from "highlight.js/lib/languages/awk";
import basic from "highlight.js/lib/languages/basic";
import c from "highlight.js/lib/languages/c";
import clojure from "highlight.js/lib/languages/clojure";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import dart from "highlight.js/lib/languages/dart";
import delphi from "highlight.js/lib/languages/delphi";
import elixir from "highlight.js/lib/languages/elixir";
import erlang from "highlight.js/lib/languages/erlang";
import fortran from "highlight.js/lib/languages/fortran";
import fsharp from "highlight.js/lib/languages/fsharp";
import go from "highlight.js/lib/languages/go";
import haskell from "highlight.js/lib/languages/haskell";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import julia from "highlight.js/lib/languages/julia";
import kotlin from "highlight.js/lib/languages/kotlin";
import lisp from "highlight.js/lib/languages/lisp";
import lua from "highlight.js/lib/languages/lua";
import nim from "highlight.js/lib/languages/nim";
import objectivec from "highlight.js/lib/languages/objectivec";
import ocaml from "highlight.js/lib/languages/ocaml";
import perl from "highlight.js/lib/languages/perl";
import php from "highlight.js/lib/languages/php";
import prolog from "highlight.js/lib/languages/prolog";
import python from "highlight.js/lib/languages/python";
import r from "highlight.js/lib/languages/r";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scala from "highlight.js/lib/languages/scala";
import scheme from "highlight.js/lib/languages/scheme";
import smalltalk from "highlight.js/lib/languages/smalltalk";
import sml from "highlight.js/lib/languages/sml";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";

const GRAMMARS = {
  ada,
  awk,
  basic,
  c,
  clojure,
  cpp,
  csharp,
  dart,
  delphi,
  elixir,
  erlang,
  fortran,
  fsharp,
  go,
  haskell,
  java,
  javascript,
  julia,
  kotlin,
  lisp,
  nim,
  j,
  lua,
  objectivec,
  ocaml,
  perl,
  php,
  prolog,
  python,
  r,
  ruby,
  rust,
  scala,
  scheme,
  smalltalk,
  sml,
  sql,
  swift,
  typescript,
};
// J has no grammar of its own in highlight.js; this covers its lexical skeleton.
function j(): ReturnType<LanguageFn> {
  return {
    name: "J",
    contains: [
      { scope: "comment", begin: /NB\..*$/ },
      { scope: "string", begin: /'/, end: /'/, contains: [{ begin: /''/ }] },
      {
        scope: "keyword",
        begin:
          /\b(?:assert|break|case|catch[dt]?|continue|do|else|elseif|end|fcase|for(?:_\w+)?|if|return|select|throw|try|while|whilst)\./,
      },
      { scope: "symbol", begin: /=[.:]/ },
      { scope: "number", begin: /(?<![\w.])_?\d[\w.]*/ },
    ],
  };
}

for (const [name, grammar] of Object.entries(GRAMMARS)) hljs.registerLanguage(name, grammar as LanguageFn);

/** Language id → highlight.js grammar (a close relative where the language has none of its own). */
const GRAMMAR: Record<string, keyof typeof GRAMMARS> = {
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
  awk: "awk",
  sql: "sql",
  scheme: "scheme",
  ada: "ada",
  "objective-c": "objectivec",
  "common-lisp": "lisp",
  cpp: "cpp",
  "object-pascal": "delphi",
  miranda: "haskell",
  erlang: "erlang",
  oberon: "delphi",
  perl: "perl",
  haskell: "haskell",
  j: "j",
  python: "python",
  lua: "lua",
  r: "r",
  java: "java",
  javascript: "javascript",
  ruby: "ruby",
  php: "php",
  racket: "scheme",
  ocaml: "ocaml",
  csharp: "csharp",
  scala: "scala",
  fsharp: "fsharp",
  clojure: "clojure",
  nim: "nim",
  go: "go",
  rust: "rust",
  kotlin: "kotlin",
  dart: "dart",
  elixir: "elixir",
  julia: "julia",
  typescript: "typescript",
  swift: "swift",
  gleam: "rust",
};

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/** Returns safe HTML for `code` (hljs escapes its input). */
export function highlight(code: string, langId: string): string {
  const grammar = GRAMMAR[langId];
  if (grammar) {
    return hljs.highlight(code, { language: grammar, ignoreIllegals: true }).value;
  }
  return escape(code);
}
