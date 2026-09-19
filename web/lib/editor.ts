// CodeMirror 6 editor for CodeWindow. Client only, and loaded on demand (dynamic import) the first time a
// window enters edit mode, so pages that are only read never download it.
//
// Tokens get the same hljs-* classes as the server highlighter (lib/highlight.ts), so the base colours and
// every period skin in styles.css apply to the editor unchanged.
import { Compartment, EditorState, type Extension, Prec } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from "@codemirror/commands";
import {
  bracketMatching,
  indentOnInput,
  indentUnit,
  StreamLanguage,
  type StreamParser,
  type StringStream,
  syntaxHighlighting,
} from "@codemirror/language";
import { tagHighlighter, tags as t } from "@lezer/highlight";
import { LEAN, LOGO, ODIN, UNISON } from "./keywords.ts";

export type EditorHandle = {
  setReadOnly(readOnly: boolean): void;
  focus(): void;
  destroy(): void;
};

export type EditorOptions = {
  doc: string;
  lang: string;
  label: string;
  readOnly: boolean;
  onChange(doc: string): void;
  onRun(): void;
};

const hljsClasses = tagHighlighter([
  { tag: [t.keyword, t.modifier, t.operatorKeyword], class: "hljs-keyword" },
  { tag: [t.atom, t.bool, t.null], class: "hljs-literal" },
  { tag: t.standard(t.variableName), class: "hljs-built_in" },
  { tag: [t.string, t.special(t.string), t.character, t.regexp, t.escape], class: "hljs-string" },
  { tag: t.comment, class: "hljs-comment" },
  { tag: t.number, class: "hljs-number" },
  { tag: [t.definition(t.variableName), t.function(t.variableName)], class: "hljs-title" },
  { tag: [t.typeName, t.className, t.namespace], class: "hljs-type" },
  { tag: [t.meta, t.processingInstruction, t.macroName, t.annotation, t.attributeName], class: "hljs-meta" },
  { tag: t.labelName, class: "hljs-symbol" },
]);

const legacy = (parser: StreamParser<unknown>) => StreamLanguage.define(parser);

// J has no CodeMirror mode: comments, strings, control words (`if.` … `end.`), copulas and numbers.
const jParser: StreamParser<unknown> = {
  name: "j",
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/^NB\..*/)) return "comment";
    if (stream.match(/^'(?:[^']|'')*'?/)) return "string";
    if (
      stream.match(
        /^(?:assert|break|case|catch[dt]?|continue|do|else|elseif|end|fcase|for(?:_\w+)?|if|return|select|throw|try|while|whilst)\./,
      )
    ) {
      return "keyword";
    }
    if (stream.match(/^=[.:]/)) return "keyword";
    if (stream.match(/^_?\d[\w.]*/)) return "number";
    if (stream.match(/^[A-Za-z]\w*/)) return "variableName";
    stream.next();
    return null;
  },
};

// The xTalks (HyperTalk, AppleScript) have no CodeMirror mode, and VB's `'` comments would swallow every `'s`.
// `--` comments, strings, numbers and English keywords; AppleScript adds nestable `(* … *)` and `#` comments
// and `|barred identifiers|`.
const xTalk = (words: string, apple: boolean): StreamParser<{ depth: number }> => {
  const keywords = new Set(words.split(" "));
  return {
    name: apple ? "applescript" : "hypertalk",
    startState: () => ({ depth: 0 }),
    token(stream, state) {
      if (state.depth > 0) {
        while (!stream.eol()) {
          if (stream.match("(*")) state.depth++;
          else if (stream.match("*)")) {
            if (--state.depth === 0) break;
          } else stream.next();
        }
        return "comment";
      }
      if (stream.eatSpace()) return null;
      if (stream.match("--") || (apple && stream.match(/^#(?!!)/))) {
        stream.skipToEnd();
        return "comment";
      }
      if (apple && stream.match("(*")) {
        state.depth = 1;
        return "comment";
      }
      if (stream.match(apple ? /^"(?:[^"\\]|\\.)*"?/ : /^"[^"]*"?/)) return "string";
      if (apple && stream.match(/^\|[^|]*\|?/)) return "variableName";
      if (stream.match(/^\d+(?:\.\d+)?(?:e[+-]?\d+)?/i)) return "number";
      if (stream.match(/^[A-Za-z_]\w*/)) {
        return keywords.has(stream.current().toLowerCase()) ? "keyword" : "variableName";
      }
      stream.next();
      return null;
    },
  };
};
const XTALK_WORDS = "on end function if then else repeat with while until for times exit next return pass send to " +
  "me it the of in is not and or put into after before get set div mod contains global local";
const hyperTalkParser = xTalk(`${XTALK_WORDS} do value item items word words char chars line lines number`, false);
const appleScriptParser = xTalk(
  `${XTALK_WORDS} tell script property my its try error considering ignoring using terms from given as a an ` +
    "every whose where thru through first last some class record list true false missing log copy count",
  true,
);

// Nim and Mojo read like Python with keywords of their own.
const NIM_KEYWORDS = ("proc func let var const type object enum tuple ref ptr macro template iterator method " +
  "converter case of when discard distinct mod div shl shr xor nil block static defer concept do export include " +
  "mixin bind addr cast using").split(" ");
const MOJO_KEYWORDS = "var struct trait comptime mut imm ref out deinit raises where".split(" ");
// mkPython is exported by the mode but missing from its type declarations.
const pythonWith = (keywords: string[]) =>
  import("@codemirror/legacy-modes/mode/python").then((m) =>
    legacy((m as unknown as { mkPython(conf: object): StreamParser<unknown> }).mkPython({ extra_keywords: keywords }))
  );

// Lean has no CodeMirror mode: `--` and nestable `/- … -/` comments, strings and char literals, #commands,
// @[attributes], «quoted names», keywords and core tactics, and the name after def/theorem/structure.
const set = (s: string) => new Set(s.split(" "));
const LEAN_KW = set(LEAN.keywords),
  LEAN_TAC = set(LEAN.tactics),
  LEAN_TY = set(LEAN.types),
  LEAN_LIT = set(LEAN.literals);
const LEAN_DEFS = set("def theorem lemma abbrev structure class inductive opaque axiom");
const leanParser: StreamParser<{ depth: number; def: boolean }> = {
  name: "lean",
  startState: () => ({ depth: 0, def: false }),
  token(stream, state) {
    if (state.depth > 0) {
      while (!stream.eol()) {
        if (stream.match("/-")) state.depth++;
        else if (stream.match("-/")) {
          if (--state.depth === 0) break;
        } else stream.next();
      }
      return "comment";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("--")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/-")) {
      state.depth = 1;
      return "comment";
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return "string";
    if (stream.match(/^'(?:\\.|[^\\'])'/)) return "string"; // identifiers consume their own primes, so this is a char
    if (stream.match(/^#[a-z_]+/)) return "meta";
    if (stream.match(/^@\[[^\]]*\]?/)) return "meta";
    if (stream.match(/^«[^»]*»?/)) return state.def ? ((state.def = false), "def") : "variable";
    if (stream.match(/^(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)/)) {
      return "number";
    }
    if (stream.match(/^[A-Za-z_λÀ-ɏͰ-Ͽ][\w'!?.À-ɏͰ-Ͽ]*/)) {
      const w = stream.current().replace(/\.$/, "");
      if (state.def) {
        state.def = false;
        return "def";
      }
      if (LEAN_KW.has(w)) {
        state.def = LEAN_DEFS.has(w);
        return "keyword";
      }
      if (LEAN_TAC.has(w)) return "builtin";
      if (LEAN_TY.has(w)) return "type";
      if (LEAN_LIT.has(w)) return "atom";
      return "variable";
    }
    state.def = false;
    stream.next();
    return null;
  },
};

// Unison has no CodeMirror mode. Haskell's leaves ability/cases/handle/with unstyled and marks '{IO} an error.
// Nestable {- -} comments, {{ }} docs and """ text can span lines; `---` folds away the rest of the file.
const UNISON_KW = new Set(UNISON.keywords.split(" "));
const unisonParser: StreamParser<{ depth: number; docs: number; text: boolean; fold: boolean }> = {
  name: "unison",
  startState: () => ({ depth: 0, docs: 0, text: false, fold: false }),
  token(stream, state) {
    if (state.fold) {
      stream.skipToEnd();
      return "comment";
    }
    if (state.depth > 0) {
      while (!stream.eol()) {
        if (stream.match("{-")) state.depth++;
        else if (stream.match("-}")) {
          if (--state.depth === 0) break;
        } else stream.next();
      }
      return "comment";
    }
    if (state.docs > 0) {
      while (!stream.eol()) {
        if (stream.match("{{")) state.docs++;
        else if (stream.match("}}")) {
          if (--state.docs === 0) break;
        } else stream.next();
      }
      return "string";
    }
    if (state.text) {
      if (stream.skipTo('"""')) {
        stream.match('"""');
        state.text = false;
      } else stream.skipToEnd();
      return "string";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("---")) {
      state.fold = true;
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match(/^--.*/)) return "comment";
    if (stream.match("{-")) {
      state.depth = 1;
      return "comment";
    }
    if (stream.match("{{")) {
      state.docs = 1;
      return "string";
    }
    if (stream.match('"""')) {
      state.text = true;
      return "string";
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return "string";
    if (stream.match(/^\?(?:\\.|[^\s\\])/)) return "string";
    if (stream.match(/^(?:0xs[\da-fA-F]*|0x[\da-fA-F]+|0o[0-7]+|0b[01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/)) {
      return "number";
    }
    // A sign belongs to the literal (+3 is an Int) unless it follows a name or a number: n-1 is a subtraction.
    if (!/[\w.]/.test(stream.string.charAt(stream.start - 1)) && stream.match(/^[+-]\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/)) {
      return "number";
    }
    if (stream.match(/^['!](?=[\w({[])/)) return "meta";
    if (stream.match(/^[A-Z][\w!']*/)) return "type";
    if (stream.match(/^[a-z_][\w!']*/)) {
      const word = stream.current(), rest = stream.string.slice(stream.pos);
      if (UNISON_KW.has(word)) return "keyword";
      if (word === "true" || word === "false") return "atom";
      // A signature (`name : Type`), or a definition at the start of a line.
      const first = stream.string.slice(0, stream.start).trim() === "";
      if ((first && /^\s*:(?![:=])/.test(rest)) || (stream.start === 0 && /^[^=]*=(?!=)/.test(rest))) return "def";
      return "variable";
    }
    stream.next();
    return null;
  },
};

// Logo has no legacy mode either. Same classes as its hljs grammar; `to` at the start of a line names a procedure.
const logoKeywords = new Set(LOGO.keywords.split(" "));
const logoBuiltins = new Set(LOGO.builtins.split(" "));
const logoParser: StreamParser<{ naming: boolean }> = {
  name: "logo",
  startState: () => ({ naming: false }),
  token(stream, state) {
    if (stream.sol()) state.naming = false;
    if (stream.eatSpace()) return null;
    if (stream.match(/^;.*/)) return "comment";
    if (stream.match(/^"\|[^|]*\|?/) || stream.match(/^"[^\s\[\]();]*/)) return "string";
    if (stream.match(/^:[^\s\[\]();+\-*\/=<>]+/) || stream.match(/^\?\d*(?![\w.?])/)) return "labelName";
    if (stream.match(/^\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![\w.])/i)) return "number";
    if (stream.match(/^[+\-*\/=<>]+/)) return "operator";
    if (stream.match(/^[^\s\[\]();"+\-*\/=<>]+/)) {
      const word = stream.current().toLowerCase();
      if (state.naming) return (state.naming = false, "variableName.definition");
      if (word === "to" || word === ".macro") {
        state.naming = stream.string.slice(0, stream.start).trim() === "";
        return "keyword";
      }
      if (logoKeywords.has(word)) return "keyword";
      if (logoBuiltins.has(word)) return "variableName.standard";
      return word === "true" || word === "false" ? "bool" : "variableName";
    }
    stream.next();
    return null;
  },
};

// Odin: the clike factory with Odin's words, plus hooks for #directives, @(attributes), $T parameters and raw strings.
const words = (s: string) => Object.fromEntries(s.split(" ").map((w) => [w, true]));
const odinMode = () =>
  import("@codemirror/legacy-modes/mode/clike").then((m) =>
    legacy(m.clike({
      name: "odin",
      keywords: words(ODIN.keywords),
      types: words(ODIN.types),
      builtin: words(ODIN.builtins),
      atoms: words(ODIN.literals),
      blockKeywords: words("if else when for switch case do defer"),
      isOperatorChar: /[+\-*&%=<>!?|\/^~]/,
      isIdentifierChar: /[\w_\xa1-\uffff]/, // no `$`, so the hook below can mark $T
      indentStatements: false,
      hooks: {
        "#": (s: StringStream) => (s.eat("+"), s.eatWhile(/[\w_]/), "meta"),
        "@": (s: StringStream) => (s.match(/^\([^)]*\)/) || s.eatWhile(/[\w_]/), "meta"),
        "$": (s: StringStream) => (s.eatWhile(/[\w_]/), "type"),
        "`": (s: StringStream) => (s.skipTo("`") ? s.next() : s.skipToEnd(), "string"),
      },
    }))
  );

// Modes per language. Close relatives stand in where CodeMirror has no mode of its own:
// the ALGOL family (Oberon, Object Pascal) uses Pascal, Ada uses VHDL (itself derived from Ada), Prolog uses
// Erlang (whose syntax came from Prolog), Elixir uses Ruby, Zig and Gleam use Rust, AWK uses Perl, B uses C and
// NewtonScript uses JavaScript.
const MODES: Record<string, () => Promise<Extension>> = {
  fortran: () => import("@codemirror/legacy-modes/mode/fortran").then((m) => legacy(m.fortran)),
  algol60: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  cobol: () => import("@codemirror/legacy-modes/mode/cobol").then((m) => legacy(m.cobol)),
  lisp: () => import("@codemirror/legacy-modes/mode/commonlisp").then((m) => legacy(m.commonLisp)),
  basic: () => import("@codemirror/legacy-modes/mode/vb").then((m) => legacy(m.vb)),
  apl: () => import("@codemirror/legacy-modes/mode/apl").then((m) => legacy(m.apl)),
  simula: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  logo: () => Promise.resolve(legacy(logoParser as StreamParser<unknown>)),
  algol68: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  b: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.c)),
  forth: () => import("@codemirror/legacy-modes/mode/forth").then((m) => legacy(m.forth)),
  pascal: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  c: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.c)),
  prolog: () => import("@codemirror/legacy-modes/mode/erlang").then((m) => legacy(m.erlang)),
  smalltalk: () => import("@codemirror/legacy-modes/mode/smalltalk").then((m) => legacy(m.smalltalk)),
  ml: () => import("@codemirror/legacy-modes/mode/mllike").then((m) => legacy(m.sml)),
  sql: () => import("@codemirror/legacy-modes/mode/sql").then((m) => legacy(m.standardSQL)),
  scheme: () => import("@codemirror/legacy-modes/mode/scheme").then((m) => legacy(m.scheme)),
  awk: () => import("@codemirror/legacy-modes/mode/perl").then((m) => legacy(m.perl)),
  modula2: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  sh: () => import("@codemirror/legacy-modes/mode/shell").then((m) => legacy(m.shell)),
  ada: () => import("@codemirror/legacy-modes/mode/vhdl").then((m) => legacy(m.vhdl)),
  "common-lisp": () => import("@codemirror/legacy-modes/mode/commonlisp").then((m) => legacy(m.commonLisp)),
  "objective-c": () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.objectiveC)),
  cpp: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.cpp)),
  "object-pascal": () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  miranda: () => import("@codemirror/legacy-modes/mode/haskell").then((m) => legacy(m.haskell)),
  eiffel: () => import("@codemirror/legacy-modes/mode/eiffel").then((m) => legacy(m.eiffel)),
  erlang: () => import("@codemirror/legacy-modes/mode/erlang").then((m) => legacy(m.erlang)),
  perl: () => import("@codemirror/legacy-modes/mode/perl").then((m) => legacy(m.perl)),
  oberon: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  hypertalk: () => Promise.resolve(legacy(hyperTalkParser as StreamParser<unknown>)),
  self: () => import("@codemirror/legacy-modes/mode/smalltalk").then((m) => legacy(m.smalltalk)),
  haskell: () => import("@codemirror/legacy-modes/mode/haskell").then((m) => legacy(m.haskell)),
  j: () => Promise.resolve(legacy(jParser)),
  dylan: () => import("@codemirror/legacy-modes/mode/dylan").then((m) => legacy(m.dylan)),
  applescript: () => Promise.resolve(legacy(appleScriptParser as StreamParser<unknown>)),
  newtonscript: () => import("@codemirror/legacy-modes/mode/javascript").then((m) => legacy(m.javascript)),
  python: () => import("@codemirror/legacy-modes/mode/python").then((m) => legacy(m.python)),
  "visual-basic": () => import("@codemirror/legacy-modes/mode/vb").then((m) => legacy(m.vb)),
  qbasic: () => import("@codemirror/legacy-modes/mode/vb").then((m) => legacy(m.vb)),
  lua: () => import("@codemirror/legacy-modes/mode/lua").then((m) => legacy(m.lua)),
  r: () => import("@codemirror/legacy-modes/mode/r").then((m) => legacy(m.r)),
  java: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.java)),
  javascript: () => import("@codemirror/legacy-modes/mode/javascript").then((m) => legacy(m.javascript)),
  php: () => import("@codemirror/lang-php").then((m) => m.php()),
  ruby: () => import("@codemirror/legacy-modes/mode/ruby").then((m) => legacy(m.ruby)),
  racket: () => import("@codemirror/legacy-modes/mode/scheme").then((m) => legacy(m.scheme)),
  ocaml: () => import("@codemirror/legacy-modes/mode/mllike").then((m) => legacy(m.oCaml)),
  csharp: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.csharp)),
  scala: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.scala)),
  fsharp: () => import("@codemirror/legacy-modes/mode/mllike").then((m) => legacy(m.fSharp)),
  clojure: () => import("@codemirror/legacy-modes/mode/clojure").then((m) => legacy(m.clojure)),
  nim: () => pythonWith(NIM_KEYWORDS),
  go: () => import("@codemirror/legacy-modes/mode/go").then((m) => legacy(m.go)),
  kotlin: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.kotlin)),
  dart: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.dart)),
  elixir: () => import("@codemirror/legacy-modes/mode/ruby").then((m) => legacy(m.ruby)),
  julia: () => import("@codemirror/legacy-modes/mode/julia").then((m) => legacy(m.julia)),
  rust: () => import("@codemirror/legacy-modes/mode/rust").then((m) => legacy(m.rust)),
  lean: () => Promise.resolve(legacy(leanParser as StreamParser<unknown>)),
  typescript: () => import("@codemirror/legacy-modes/mode/javascript").then((m) => legacy(m.typescript)),
  elm: () => import("@codemirror/legacy-modes/mode/elm").then((m) => legacy(m.elm)),
  swift: () => import("@codemirror/legacy-modes/mode/swift").then((m) => legacy(m.swift)),
  crystal: () => import("@codemirror/legacy-modes/mode/crystal").then((m) => legacy(m.crystal)),
  zig: () => import("@codemirror/legacy-modes/mode/rust").then((m) => legacy(m.rust)),
  odin: odinMode,
  gleam: () => import("@codemirror/legacy-modes/mode/rust").then((m) => legacy(m.rust)),
  unison: () => Promise.resolve(legacy(unisonParser as StreamParser<unknown>)),
  mojo: () => pythonWith(MOJO_KEYWORDS),
};

/** The snippet's own indent step: a tab if it uses tabs, else the smallest increase between lines. */
export function detectIndent(code: string): string {
  const lines = code.split("\n").filter((l) => l.trim());
  if (lines.some((l) => l.startsWith("\t"))) return "\t";
  let step = Infinity, prev = 0;
  for (const l of lines) {
    const n = l.length - l.trimStart().length;
    if (n - prev >= 2) step = Math.min(step, n - prev);
    prev = n;
  }
  return " ".repeat(Number.isFinite(step) ? Math.min(step, 8) : 4);
}

// Lay the editor out exactly like the read-only <pre class="win-code">, so entering edit mode doesn't move
// the text, and take font and colour from the window's skin.
const windowTheme = EditorView.theme({
  "&": { color: "inherit", backgroundColor: "transparent", fontSize: "inherit", maxHeight: "360px" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "inherit" },
  ".cm-content": { padding: "12px 0", caretColor: "currentColor" },
  ".cm-line": { padding: "0 14px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "currentColor", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, currentColor 22%, transparent)",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, currentColor 6%, transparent)" },
  "&.cm-editor:not(.cm-focused) .cm-activeLine": { backgroundColor: "transparent" },
  "&.cm-focused .cm-matchingBracket": {
    backgroundColor: "transparent",
    outline: "1px solid color-mix(in srgb, currentColor 55%, transparent)",
  },
});

const editable = (readOnly: boolean) => [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];

export async function createEditor(parent: HTMLElement, o: EditorOptions): Promise<EditorHandle> {
  const mode = await (MODES[o.lang]?.() ?? Promise.resolve([])).catch((e) => {
    console.warn(`No syntax mode for ${o.lang}:`, e);
    return [];
  });
  const access = new Compartment();
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: o.doc,
      extensions: [
        Prec.highest(keymap.of([{ key: "Mod-Enter", run: () => (o.onRun(), true) }])),
        keymap.of([
          {
            // Tab inserts one indent step at the cursor (or indents the selected lines); Shift-Tab dedents.
            // Press Escape first to let Tab move focus out of the editor instead.
            key: "Tab",
            run: (v) => {
              if (v.state.readOnly) return false;
              if (v.state.selection.ranges.some((r) => !r.empty)) return indentMore(v);
              v.dispatch(v.state.replaceSelection(v.state.facet(indentUnit)), {
                scrollIntoView: true,
                userEvent: "input",
              });
              return true;
            },
            shift: indentLess,
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        history(),
        drawSelection(),
        highlightSpecialChars(),
        highlightActiveLine(),
        bracketMatching(),
        indentOnInput(),
        indentUnit.of(detectIndent(o.doc)),
        mode,
        syntaxHighlighting(hljsClasses),
        windowTheme,
        access.of(editable(o.readOnly)),
        EditorView.contentAttributes.of({ "aria-label": o.label }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) o.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
  return {
    setReadOnly: (readOnly) => view.dispatch({ effects: access.reconfigure(editable(readOnly)) }),
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
