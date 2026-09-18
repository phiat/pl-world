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
  syntaxHighlighting,
} from "@codemirror/language";
import { tagHighlighter, tags as t } from "@lezer/highlight";

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

// Nim reads like Python with its own keywords.
const NIM_KEYWORDS = ("proc func let var const type object enum tuple ref ptr macro template iterator method " +
  "converter case of when discard distinct mod div shl shr xor nil block static defer concept do export include " +
  "mixin bind addr cast using").split(" ");

// Modes per language. Close relatives stand in where CodeMirror has no mode of its own:
// the ALGOL family (Oberon, Object Pascal) uses Pascal, Ada uses VHDL (itself derived from Ada), Prolog uses
// Erlang (whose syntax came from Prolog), Elixir uses Ruby, Zig and Gleam use Rust, AWK uses Perl, B uses C.
const MODES: Record<string, () => Promise<Extension>> = {
  fortran: () => import("@codemirror/legacy-modes/mode/fortran").then((m) => legacy(m.fortran)),
  algol60: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
  cobol: () => import("@codemirror/legacy-modes/mode/cobol").then((m) => legacy(m.cobol)),
  lisp: () => import("@codemirror/legacy-modes/mode/commonlisp").then((m) => legacy(m.commonLisp)),
  basic: () => import("@codemirror/legacy-modes/mode/vb").then((m) => legacy(m.vb)),
  apl: () => import("@codemirror/legacy-modes/mode/apl").then((m) => legacy(m.apl)),
  simula: () => import("@codemirror/legacy-modes/mode/pascal").then((m) => legacy(m.pascal)),
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
  self: () => import("@codemirror/legacy-modes/mode/smalltalk").then((m) => legacy(m.smalltalk)),
  haskell: () => import("@codemirror/legacy-modes/mode/haskell").then((m) => legacy(m.haskell)),
  j: () => Promise.resolve(legacy(jParser)),
  python: () => import("@codemirror/legacy-modes/mode/python").then((m) => legacy(m.python)),
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
  // mkPython is exported by the mode but missing from its type declarations.
  nim: () =>
    import("@codemirror/legacy-modes/mode/python").then((m) =>
      legacy(
        (m as unknown as { mkPython(conf: object): StreamParser<unknown> }).mkPython({ extra_keywords: NIM_KEYWORDS }),
      )
    ),
  go: () => import("@codemirror/legacy-modes/mode/go").then((m) => legacy(m.go)),
  kotlin: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.kotlin)),
  dart: () => import("@codemirror/legacy-modes/mode/clike").then((m) => legacy(m.dart)),
  elixir: () => import("@codemirror/legacy-modes/mode/ruby").then((m) => legacy(m.ruby)),
  julia: () => import("@codemirror/legacy-modes/mode/julia").then((m) => legacy(m.julia)),
  rust: () => import("@codemirror/legacy-modes/mode/rust").then((m) => legacy(m.rust)),
  typescript: () => import("@codemirror/legacy-modes/mode/javascript").then((m) => legacy(m.typescript)),
  swift: () => import("@codemirror/legacy-modes/mode/swift").then((m) => legacy(m.swift)),
  zig: () => import("@codemirror/legacy-modes/mode/rust").then((m) => legacy(m.rust)),
  gleam: () => import("@codemirror/legacy-modes/mode/rust").then((m) => legacy(m.rust)),
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
