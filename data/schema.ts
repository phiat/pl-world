// Source of truth for the shape of data/languages/*.json, data/concepts.json and data/tasks.json.
// Shared by the validator, the DB builder, the Fresh app and the sandbox runner.
import { z } from "zod";

import conceptsJson from "./concepts.json" with { type: "json" };
import tasksJson from "./tasks.json" with { type: "json" };

export const LANGUAGE_IDS = [
  // 1957–1969: foundations
  "fortran",
  "lisp",
  "cobol",
  "algol60",
  "apl",
  "basic",
  "simula",
  "logo",
  "bcpl",
  "algol68",
  "b",
  // 1970–1979: systems, structure, new paradigms
  "pascal",
  "forth",
  "c",
  "smalltalk",
  "prolog",
  "ml",
  "sql",
  "clu",
  "awk",
  "scheme",
  "modula2",
  "sh",
  // 1980–1990: objects, modules, functional purity
  "ada",
  "objective-c",
  "common-lisp",
  "matlab",
  "cpp",
  "miranda",
  "object-pascal",
  "eiffel",
  "erlang",
  "self",
  "hypertalk",
  "oberon",
  "perl",
  "haskell",
  "j",
  // 1991–2004: the internet era
  "python",
  "visual-basic",
  "qbasic",
  "dylan",
  "lua",
  "r",
  "applescript",
  "newtonscript",
  "java",
  "javascript",
  "ruby",
  "php",
  "racket",
  "ocaml",
  "csharp",
  "d",
  "scala",
  // 2005–today: modern
  "fsharp",
  "powershell",
  "clojure",
  "nim",
  "go",
  "rust",
  "kotlin",
  "dart",
  "elixir",
  "julia",
  "typescript",
  "elm",
  "lean",
  "swift",
  "crystal",
  "zig",
  "odin",
  "gleam",
  "unison",
  "v",
  "mojo",
] as const;

export const LanguageId = z.enum(LANGUAGE_IDS);
export const ConceptId = z.enum(conceptsJson.map((c) => c.id) as [string, ...string[]]);
export const TaskId = z.enum(tasksJson.map((t) => t.id) as [string, ...string[]]);

export const Paradigm = z.enum([
  "imperative",
  "procedural",
  "structured",
  "object-oriented",
  "prototype-based",
  "functional",
  "logic",
  "declarative",
  "array",
  "concatenative",
  "concurrent",
  "actor",
  "generic",
  "reflective",
  "metaprogramming",
  "scripting",
  "event-driven",
  "query",
  "data-oriented",
  "multi-paradigm",
]);

// Genetic clade, used for colouring and grouping the family tree.
export const Family = z.enum([
  "fortran", // Fortran
  "cobol", // COBOL
  "algol", // ALGOL 60/68, Pascal, Modula-2, Ada, Simula, Eiffel...
  "c", // BCPL, B, C and its brace-syntax descendants
  "lisp", // Lisp, Scheme, Common Lisp, Clojure...
  "ml", // ML, Miranda, Haskell, OCaml, F#...
  "smalltalk", // Smalltalk, Self, and pure-OO descendants
  "logic", // Prolog and relatives
  "array", // APL and array/numeric languages
  "stack", // Forth
  "query", // SQL
  "basic", // BASIC
  "scripting", // Perl, PHP, Python, Ruby, Lua... (when no stronger clade fits)
]);

export const SyntaxFamily = z.enum([
  "fortran",
  "algol",
  "c-braces",
  "s-expression",
  "ml",
  "smalltalk",
  "prolog",
  "apl",
  "concatenative",
  "english-like",
  "offside",
  "other",
]);

export const BlockStyle = z.enum([
  "braces",
  "begin-end",
  "keyword-end",
  "indentation",
  "s-expression",
  "line-based",
  "clauses",
  "none",
]);

export const Typing = z.object({
  discipline: z.enum(["static", "dynamic", "gradual", "untyped"]),
  strength: z.enum(["strong", "weak"]),
  inference: z.enum(["none", "local", "global"]),
  equivalence: z.enum(["nominal", "structural", "duck", "mixed", "n/a"]),
  notes: z.string().optional(),
});

export const Memory = z.enum([
  "static",
  "manual",
  "tracing-gc",
  "reference-counting",
  "ownership",
  "stack",
  "mixed",
]);

export const Execution = z.enum([
  "native-compiled",
  "bytecode-vm",
  "interpreted",
  "jit",
  "transpiled",
  "image-based",
]);

export const Status = z.enum([
  "active", // widely used, evolving
  "maintained", // still developed/used, niche or legacy
  "historical", // mostly of historical interest
]);

export const LineageKind = z.enum([
  "influence", // borrowed ideas
  "successor", // direct evolutionary successor (BCPL -> B -> C)
  "dialect", // a dialect/variant of the parent (Scheme of Lisp)
  "superset", // extends the parent's syntax (C++ of C, TypeScript of JavaScript)
  "platform", // built on the parent's runtime/VM (Elixir on Erlang's BEAM)
]);

export const Lineage = z.object({
  id: LanguageId,
  kind: LineageKind,
  weight: z.enum(["major", "minor"]),
  note: z.string().optional(),
});

export const ExternalInfluence = z.object({
  name: z.string(),
  year: z.number().int().optional(),
  note: z.string().optional(),
});

export const TraitLevel = z.enum([
  "core", // central, idiomatic, built into the language
  "supported", // available in the language but not central / limited form
  "library", // provided by the standard library or a ubiquitous library
]);

export const Trait = z.object({
  level: TraitLevel,
  since: z.number().int().optional(), // year it arrived, if not present from the start
  version: z.string().optional(), // e.g. "Java 8", "C++11", "Python 2.0"
  note: z.string().optional(),
});

export const Snippet = z.object({
  title: z.string().optional(), // required for "signature"
  dialect: z.string(), // e.g. "Fortran 77 (fixed form)", "C99", "R7RS Scheme"
  code: z.string(),
  expected_output: z.string(),
  notes: z.string().optional(),
  concepts: z.array(ConceptId).default([]), // concepts the snippet is built to demonstrate (signature snippets)
  verified: z.boolean().default(false), // set true only after running in the sandbox
});

export const Toolchain = z.object({
  name: z.string(), // e.g. "GnuCOBOL"
  version: z.string().optional(),
  docker_image: z.string().optional(), // e.g. "gcc:14", "swipl:stable"
  install: z.string().optional(), // e.g. "apt-get install -y gnucobol"
  dockerfile: z.string().optional(), // repo path of the image recipe, e.g. "sandbox/clu/Dockerfile"
  compile: z.string().optional(), // with {file} / {out} placeholders
  run: z.string(), // with {file} / {out} placeholders
  notes: z.string().optional(),
});

export const Runtime = z.object({
  strategy: z.enum(["container", "wasm", "container+wasm", "emulated", "unavailable"]),
  toolchains: z.array(Toolchain),
  browser: z.object({ name: z.string(), url: z.string().url(), notes: z.string().optional() }).nullable(),
  notes: z.string().optional(),
});

export const Milestone = z.object({
  year: z.number().int(),
  event: z.string(),
});

export const Language = z.object({
  id: LanguageId,
  name: z.string(),
  aliases: z.array(z.string()),
  year: z.number().int().min(1940).max(2030), // first appeared (public)
  year_note: z.string().optional(),
  designers: z.array(z.string()).min(1),
  organization: z.string().optional(),
  country: z.string().optional(),
  tagline: z.string().max(140),
  summary: z.string(), // 2–4 sentences
  history: z.string(), // 1–3 paragraphs, \n\n separated
  innovations: z.array(z.string()).min(1), // what it introduced or made mainstream
  paradigms: z.array(Paradigm).min(1),
  family: Family,
  syntax_family: SyntaxFamily,
  block_style: BlockStyle,
  typing: Typing,
  memory: Memory,
  memory_note: z.string().optional(), // e.g. C++ RAII + smart pointers
  execution: z.array(Execution).min(1),
  status: Status,
  latest_version: z.string().optional(),
  file_extensions: z.array(z.string()),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), // GitHub linguist colour if one exists
  primary_parent: LanguageId.nullable(),
  influenced_by: z.array(Lineage),
  influenced_by_external: z.array(ExternalInfluence),
  influenced: z.array(LanguageId),
  traits: z.partialRecord(ConceptId, Trait), // omitted concept = not present
  milestones: z.array(Milestone).min(1),
  trivia: z.array(z.string()).optional(),
  snippets: z.record(TaskId, Snippet),
  runtime: Runtime,
  links: z.object({
    wikipedia: z.string().url().optional(), // absent when there is no article (Unison)
    homepage: z.string().url().optional(),
    spec: z.string().url().optional(),
  }),
  sources: z.array(z.string().url()).min(1),
});

export const Concept = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum([
    "control",
    "types",
    "abstraction",
    "functional",
    "memory",
    "concurrency",
    "metaprogramming",
    "paradigm",
    "syntax",
  ]),
  summary: z.string(),
  origin: z.object({
    lang: LanguageId.optional(),
    external: z.string().optional(),
    year: z.number().int(),
    note: z.string().optional(),
  }).refine((o) => !!o.lang !== !!o.external, "origin needs exactly one of lang/external"),
  popularized_by: z.array(LanguageId),
});

export const Task = z.object({
  id: z.string(),
  name: z.string(),
  prompt: z.string(),
  shows: z.string(),
  expected_output: z.string().nullable(),
});

export type LanguageId = z.infer<typeof LanguageId>;
export type Language = z.infer<typeof Language>;
export type Concept = z.infer<typeof Concept>;
export type Task = z.infer<typeof Task>;
export type Lineage = z.infer<typeof Lineage>;
export type Trait = z.infer<typeof Trait>;
export type Snippet = z.infer<typeof Snippet>;
