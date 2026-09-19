// Server-side syntax highlighting. Languages without a highlight.js grammar render as plain text.
// Only the grammars below are bundled (the full highlight.js build carries ~190 and weighs ~1 MB).
import hljs from "highlight.js/lib/core";
import type { LanguageFn } from "highlight.js";
import { ICON, LEAN, LOGO, MODULA3, ODIN, SNOBOL, TCL, UNISON, V } from "./keywords.ts";
import ada from "highlight.js/lib/languages/ada";
import applescript from "highlight.js/lib/languages/applescript";
import awk from "highlight.js/lib/languages/awk";
import bash from "highlight.js/lib/languages/bash";
import basic from "highlight.js/lib/languages/basic";
import c from "highlight.js/lib/languages/c";
import clojure from "highlight.js/lib/languages/clojure";
import cpp from "highlight.js/lib/languages/cpp";
import crystal from "highlight.js/lib/languages/crystal";
import csharp from "highlight.js/lib/languages/csharp";
import d from "highlight.js/lib/languages/d";
import dart from "highlight.js/lib/languages/dart";
import delphi from "highlight.js/lib/languages/delphi";
import elixir from "highlight.js/lib/languages/elixir";
import elm from "highlight.js/lib/languages/elm";
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
import livecodeserver from "highlight.js/lib/languages/livecodeserver";
import lua from "highlight.js/lib/languages/lua";
import matlab from "highlight.js/lib/languages/matlab";
import nim from "highlight.js/lib/languages/nim";
import objectivec from "highlight.js/lib/languages/objectivec";
import ocaml from "highlight.js/lib/languages/ocaml";
import perl from "highlight.js/lib/languages/perl";
import php from "highlight.js/lib/languages/php";
import powershell from "highlight.js/lib/languages/powershell";
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
import tcl from "highlight.js/lib/languages/tcl";
import typescript from "highlight.js/lib/languages/typescript";
import vbnet from "highlight.js/lib/languages/vbnet";

const GRAMMARS = {
  ada,
  applescript,
  awk,
  bash,
  basic,
  c,
  clojure,
  cpp,
  crystal,
  csharp,
  d,
  dart,
  delphi,
  dylan,
  elixir,
  elm,
  erlang,
  fortran,
  fsharp,
  go,
  haskell,
  icon,
  java,
  javascript,
  julia,
  kotlin,
  lean,
  lisp,
  livecodeserver,
  logo,
  nim,
  j,
  lua,
  matlab,
  modula3,
  objectivec,
  ocaml,
  odin,
  perl,
  php,
  powershell,
  prolog,
  python,
  r,
  ruby,
  rust,
  scala,
  scheme,
  smalltalk,
  snobol,
  sml,
  sql,
  swift,
  tcl: tclCommands,
  typescript,
  unison,
  v: vlang,
  vbnet,
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

// Dylan has no highlight.js grammar, and the near relatives break on it: Julia and Ruby read `#t` / `#key` as
// comments, Delphi reads macro braces as comments.
function dylan(): ReturnType<LanguageFn> {
  return {
    name: "Dylan",
    case_insensitive: true,
    keywords: {
      $pattern: /[a-z][-a-z0-9!?*]*/,
      keyword: "define end method function generic class slot constant variable macro library module domain " +
        "let local handler if elseif else unless case select otherwise for from to below above by in while " +
        "until finally block exception cleanup afterwards begin use import export create exclude rename prefix " +
        "sealed open abstract concrete primary free inherited virtual each-subclass instance required " +
        "required-init-keyword init-keyword init-value init-function setter inline not-inline",
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      { scope: "meta", begin: /^(?:module|synopsis|author|copyright|license|library|files):/, end: /$/ },
      { scope: "string", begin: /"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "string", begin: /'/, end: /'/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "symbol", begin: /#"/, end: /"/ },
      { scope: "literal", begin: /#(?:t|f|next|rest|key|all-keys)\b/ },
      { scope: "variable", begin: /\?[=@]?[a-z][-a-z0-9!?*]*(?::[a-z]+)?/ },
      { scope: "symbol", begin: /[a-z][-a-z0-9!?*&=]*:(?!:)/ },
      { scope: "title.class", begin: /<[-a-z0-9!?*&$%@^~=+\/]+>/ },
      { scope: "variable.constant", begin: /\$[-a-z0-9!?*]+/ },
      { scope: "number", begin: /(?<![-a-z0-9])[0-9]+(?:\.[0-9]+)?(?:[ed][+-]?[0-9]+)?/ },
    ],
  };
}

// Lean has no highlight.js grammar. Haskell gets `--` comments right but not nestable `/- … -/` blocks, «quoted»
// names or Lean's keywords (def, theorem, by, fun, match … with, namespace); OCaml misses `--` comments entirely.
const LEAN_IDENT = /[A-Za-z_À-ɏͰ-κμ-Ͽἀ-῿][\w'!?À-ɏͰ-Ͽἀ-῿₀-₉]*/;
const LEAN_NAME = new RegExp(`«[^»\\n]*»|${LEAN_IDENT.source}(?:\\.${LEAN_IDENT.source})*`);
function lean(): ReturnType<LanguageFn> {
  return {
    name: "Lean",
    keywords: {
      $pattern: /[A-Za-z_λÀ-ɏͰ-Ͽ][\w'!?À-ɏͰ-Ͽ]*/,
      keyword: LEAN.keywords,
      built_in: LEAN.tactics,
      type: LEAN.types,
      literal: LEAN.literals,
    },
    contains: [
      hljs.COMMENT(/--/, /$/),
      hljs.COMMENT(/\/-/, /-\//, { contains: ["self"] }), // block and doc comments (/-- -/, /-! -/) nest
      { begin: /«/, end: /»/ }, // «quoted names» may contain spaces and keywords
      { scope: "string", begin: /"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "string", begin: /(?<![\w'])'(?:\\.|[^\\'\n])'/ }, // 'a', but not the prime in h'
      { scope: "meta", begin: /#[a-z_]+\b/ }, // #eval #check #print
      { scope: "meta", begin: /@\[/, end: /\]/ }, // @[simp]
      { scope: "symbol", begin: /`\(/ }, // syntax quotations `(term)
      {
        begin: [/\b(?:def|theorem|lemma|abbrev|opaque|axiom)/, /\s+/, LEAN_NAME],
        beginScope: { 1: "keyword", 3: "title.function" },
      },
      { begin: [/\b(?:structure|class|inductive)/, /\s+/, LEAN_NAME], beginScope: { 1: "keyword", 3: "title.class" } },
      {
        scope: "number",
        begin: /\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/,
      },
      { scope: "operator", begin: /[→←↦↔∀∃¬∧∨≠≤≥×∘⟨⟩▸·]|:=|=>|<;>|\|>\.?|<\||\.\.\.[=<]?|<\.\.\./ },
    ],
  };
}

// Logo has no highlight.js grammar, and Lisp's and Scheme's read the open quote of "word as a string running to the
// next quote. "words are strings, :variables and ? template slots symbols, and the name after `to` a title.
function logo(): ReturnType<LanguageFn> {
  return {
    name: "Logo",
    case_insensitive: true,
    keywords: { $pattern: /[a-z.][\w.?]*/, keyword: LOGO.keywords, built_in: LOGO.builtins, literal: LOGO.literals },
    contains: [
      hljs.COMMENT(/;/, /$/),
      {
        begin: [/^[ \t]*(?:to|\.macro)/, /[ \t]+/, /[^\s\[\]();]+/],
        beginScope: { 1: "keyword", 3: "title.function" },
      },
      { scope: "string", begin: /"\|/, end: /\|/ }, // "|word with spaces|
      { scope: "string", begin: /"[^\s\[\]();]*/ },
      { scope: "symbol", begin: /:[^\s\[\]();+\-*\/=<>]+/ },
      { scope: "symbol", begin: /(?<![\w.?])\?\d*(?![\w.?])/ },
      { scope: "number", begin: /(?<![\w.])\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![\w.])/ },
    ],
  };
}

// highlight.js's Tcl grammar predates lmap, try, tailcall and friends; the editor's Tcl mode shares this list.
function tclCommands(api: Parameters<LanguageFn>[0]): ReturnType<LanguageFn> {
  return { ...tcl(api), keywords: TCL.keywords };
}

// Icon has no highlight.js grammar. Python's gets the # comments and strings right but misses most of the words.
// "…" strings and '…' csets, &keywords (&letters, &null) as symbols, $define-style preprocessor lines, radix numbers.
function icon(): ReturnType<LanguageFn> {
  return {
    name: "Icon",
    keywords: { keyword: ICON.keywords, built_in: ICON.builtins },
    contains: [
      hljs.HASH_COMMENT_MODE,
      { scope: "string", begin: /"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "string", begin: /'/, end: /'/, contains: [hljs.BACKSLASH_ESCAPE] }, // csets
      { scope: "symbol", begin: /&[a-z]+/ },
      { scope: "meta", begin: /^[ \t]*\$[a-z]+/, end: /$/ },
      { scope: "title.function", begin: /(?<=\bprocedure\s+)[A-Za-z_]\w*/ },
      { scope: "title.class", begin: /(?<=\brecord\s+)[A-Za-z_]\w*/ },
      { scope: "number", begin: /\b(?:\d+[rR][\da-zA-Z]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)\b/ },
    ],
  };
}

// Modula-3 with Delphi's grammar breaks: `PROCEDURE P(...) =` has no `;` to end Delphi's heading rule, which then
// runs through the body; Delphi's case-insensitive words also catch lower-case names, and "…" isn't a string there.
function modula3(): ReturnType<LanguageFn> {
  return {
    name: "Modula-3",
    keywords: { keyword: MODULA3.keywords, type: MODULA3.types, built_in: MODULA3.builtins, literal: MODULA3.literals },
    contains: [
      hljs.COMMENT(/\(\*/, /\*\)/, { contains: ["self"] }), // comments nest
      { scope: "meta", begin: /<\*/, end: /\*>/ }, // pragmas: <*EXTERNAL*> <*NOWARN*>
      { scope: "string", begin: /"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "string", begin: /'(?:\\.|[^'\\])+'/ }, // characters
      { scope: "title.function", begin: /(?<=\bPROCEDURE\s+)[A-Za-z_]\w*/ },
      { scope: "title.class", begin: /(?<=\b(?:MODULE|INTERFACE)\s+)[A-Za-z_]\w*/ },
      { scope: "number", begin: /\b(?:\d+_[\da-fA-F]+|\d+(?:\.\d+(?:[EDX][+-]?\d+)?)?)\b/ }, // 16_FF 1.5D0
    ],
  };
}

// SNOBOL has no highlight.js grammar, and no relative has its layout: `*` in column 1 starts a comment, `-` a control
// line, and a name in column 1 is a label. A statement ends in a goto field, :(L), :S(L1)F(L2) or :($computed);
// labels and goto targets share a colour, and the system labels (END, RETURN, FRETURN, NRETURN) are keywords.
function snobol(): ReturnType<LanguageFn> {
  const keywords = { $pattern: /[A-Za-z][\w.]*/, built_in: SNOBOL.builtins };
  const strings = [{ scope: "string", begin: /'/, end: /'/ }, { scope: "string", begin: /"/, end: /"/ }];
  const systemLabel = new RegExp(`(?:${SNOBOL.labels.split(" ").join("|")})\\b`);
  return {
    name: "SNOBOL",
    case_insensitive: true, // CSNOBOL4 folds names to upper case
    keywords,
    contains: [
      hljs.COMMENT(/^\*/, /$/),
      { scope: "meta", begin: /^-[a-z]/, end: /$/ }, // -INCLUDE, -CASE
      { scope: "keyword", begin: new RegExp(`^${systemLabel.source}`) },
      { scope: "symbol", begin: /^[a-z0-9][^\s;]*/ },
      ...strings,
      {
        begin: /:(?=\s*[sf]?[(<])/, // the goto field runs to the end of the statement
        end: /$|(?=;)/,
        keywords,
        contains: [
          { scope: "keyword", begin: /(?<![\w.])[sf](?=\()/ },
          { scope: "keyword", begin: new RegExp(`(?<=(?::|\\))\\s*[sf]?\\()${systemLabel.source}(?=\\))`) },
          { scope: "symbol", begin: /(?<=(?::|\))\s*[sf]?\()[a-z][\w.]*(?=\))/ },
          ...strings,
        ],
      },
      { scope: "built_in", begin: /&[a-z]+/ }, // &ANCHOR, &TRIM, &UCASE
      { scope: "number", begin: /\b\d+(?:\.\d*)?(?:e[+-]?\d+)?\b/ },
    ],
  };
}

// Odin has no highlight.js grammar. Go leaves proc/when/using/distinct, the sized types, #directives and $T unstyled,
// and C's preprocessor rule swallows `#soa[]T` to the end of the line.
// V: Go-like, with its own words, '…' and "…" strings with ${} interpolation, `c` runes, @[attributes] and $if.
function vlang(): ReturnType<LanguageFn> {
  const interpolation = { scope: "subst", begin: /\$\{/, end: /\}/ };
  return {
    name: "V",
    keywords: { keyword: V.keywords, type: V.types, literal: V.literals, built_in: V.builtins },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.COMMENT(/\/\*/, /\*\//, { contains: ["self"] }), // block comments nest
      { scope: "string", begin: /[rc]?'/, end: /'/, contains: [hljs.BACKSLASH_ESCAPE, interpolation] },
      { scope: "string", begin: /[rc]?"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE, interpolation] },
      { scope: "string", begin: /`(?:\\.|[^`\\])+`/ }, // runes
      { scope: "meta", begin: /@\[/, end: /\]/ }, // attributes
      { scope: "meta", begin: /\$[A-Za-z_]\w*|@[A-Z_]+\b/ }, // compile time: $if $for @FILE @LINE
      { scope: "title.function", begin: /(?<=\bfn\s+(?:\([^)]*\)\s*)?)[A-Za-z_]\w*/ },
      { scope: "title.class", begin: /(?<=\b(?:struct|enum|interface|union|type)\s+)[A-Z]\w*/ },
      { scope: "operator", begin: /:=|<-|\.\.\.?|[?!](?=[\s,)]|$)/ },
      { begin: /\.[A-Za-z_]\w*/ }, // members stay plain: s.int() is a method, not the int type
      { scope: "number", begin: /\b(?:0[xbo][0-9A-Fa-f_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)\b/ },
    ],
  };
}

function odin(): ReturnType<LanguageFn> {
  return {
    name: "Odin",
    keywords: { keyword: ODIN.keywords, type: ODIN.types, literal: ODIN.literals, built_in: ODIN.builtins },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.COMMENT(/\/\*/, /\*\//, { contains: ["self"] }), // block comments nest
      { scope: "string", begin: /"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "string", begin: /`/, end: /`/ }, // raw strings
      { scope: "string", begin: /'(?:\\.|[^'\\])+'/ }, // runes
      { scope: "meta", begin: /#\+?[A-Za-z_]\w*/ }, // #soa #partial #must_tail #assert #+build
      { scope: "meta", begin: /@\(/, end: /\)/, contains: [{ scope: "string", begin: /"/, end: /"/ }] },
      { scope: "meta", begin: /@[A-Za-z_]\w*/ },
      { scope: "type", begin: /\$[A-Za-z_]\w*/ }, // polymorphic parameters: $T, $N
      { scope: "title.function", begin: /\b[A-Za-z_]\w*(?=\s*::\s*(?:#force_inline\s+|#force_no_inline\s+)?proc\b)/ },
      {
        scope: "title.class",
        begin: /\b[A-Za-z_]\w*(?=\s*::\s*(?:distinct\s+)?(?:struct|union|enum|bit_set|bit_field)\b)/,
      },
      { scope: "operator", begin: /::|:=|->|---|\.\.[=<]|\^/ },
      { scope: "number", begin: /\b(?:0[xbodhz][0-9A-Fa-f_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?i?)\b/ },
    ],
  };
}

// Unison has no highlight.js grammar. Haskell's reads `ability` as a function name, leaves cases/match/with/handle
// unstyled, and a quote inside a {{ }} doc literal starts a string that runs on past the doc.
function unison(): ReturnType<LanguageFn> {
  return {
    name: "Unison",
    keywords: { $pattern: /[A-Za-z_][\w!']*/, keyword: UNISON.keywords, literal: UNISON.literals },
    contains: [
      { scope: "comment", begin: /---/, end: /(?![\s\S])/ }, // a fold: the rest of the file is ignored
      hljs.COMMENT(/--/, /$/),
      hljs.COMMENT(/\{-/, /-\}/, { contains: ["self"] }), // block comments nest
      { scope: "string", begin: /\{\{/, end: /\}\}/, contains: ["self"] }, // doc literals
      { scope: "string", begin: /"""/, end: /"""/ },
      { scope: "string", begin: /"/, end: /"/, contains: [hljs.BACKSLASH_ESCAPE] },
      { scope: "string", begin: /\?(?:\\.|[^\s\\])/ }, // characters: ?a ?\n
      { scope: "meta", begin: /(?<![\w!'])['!](?=[\w({[])/ }, // ' (or do) delays a computation, ! forces one
      // Names being declared: `name : Type` signatures, and definitions that start a line.
      { scope: "title.function", begin: /(?<=^[ \t]*)[a-z_][\w!']*(?=[ \t]*:(?![:=]))/ },
      {
        scope: "title.function",
        begin: /^(?!(?:ability|alias|namespace|structural|type|unique|use)\b)[a-z_][\w!']*(?=[^\n=]*=(?!=))/,
      },
      { scope: "type", begin: /\b[A-Z][\w!']*/ }, // types, abilities, constructors and namespaces
      {
        scope: "number",
        begin: /(?<![\w.])(?:0xs[\da-fA-F]*|0x[\da-fA-F]+|0o[0-7]+|0b[01]+|[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/,
      },
    ],
  };
}

for (const [name, grammar] of Object.entries(GRAMMARS)) hljs.registerLanguage(name, grammar as LanguageFn);

/** Language id → highlight.js grammar (a close relative where the language has none of its own). */
const GRAMMAR: Record<string, keyof typeof GRAMMARS> = {
  fortran: "fortran",
  lisp: "lisp",
  snobol: "snobol",
  basic: "basic",
  logo: "logo",
  b: "c",
  pascal: "delphi",
  modula2: "delphi",
  sh: "bash",
  c: "c",
  smalltalk: "smalltalk",
  self: "smalltalk",
  hypertalk: "livecodeserver",
  prolog: "prolog",
  ml: "sml",
  awk: "awk",
  icon: "icon",
  sql: "sql",
  scheme: "scheme",
  ada: "ada",
  "objective-c": "objectivec",
  "common-lisp": "lisp",
  matlab: "matlab",
  dylan: "dylan",
  cpp: "cpp",
  "object-pascal": "delphi",
  miranda: "haskell",
  erlang: "erlang",
  oberon: "delphi",
  perl: "perl",
  modula3: "modula3",
  tcl: "tcl",
  haskell: "haskell",
  j: "j",
  python: "python",
  "visual-basic": "vbnet",
  qbasic: "vbnet",
  applescript: "applescript",
  newtonscript: "javascript",
  lua: "lua",
  r: "r",
  java: "java",
  javascript: "javascript",
  ruby: "ruby",
  php: "php",
  racket: "scheme",
  ocaml: "ocaml",
  csharp: "csharp",
  d: "d",
  scala: "scala",
  fsharp: "fsharp",
  powershell: "powershell",
  clojure: "clojure",
  nim: "nim",
  go: "go",
  rust: "rust",
  kotlin: "kotlin",
  dart: "dart",
  elixir: "elixir",
  julia: "julia",
  typescript: "typescript",
  elm: "elm",
  lean: "lean",
  swift: "swift",
  crystal: "crystal",
  gleam: "rust",
  unison: "unison",
  odin: "odin",
  v: "v",
  mojo: "python",
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
