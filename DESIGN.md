# PL World — design

An explorable museum of programming languages: **where languages came from** (genealogy), **what they are made of**
(traits as genes), and **how they feel** (the same program, side by side, runnable).

## 1. Architecture (all Deno)

```
                ┌──────────────────────────── web/ (Fresh 2, Preact islands, Vite) ─────────────┐
data/*.json ──► │  routes (SSR)            islands (client)                  api/               │
 (source of     │  /            River      TimelineRiver   (SVG/canvas)      /api/world         │
  truth, zod)   │  /tree        Genealogy  GenealogyGraph  (elkjs layout)    /api/search (FTS)  │
     │          │  /lang/:id    Language   DnaStrip, SnippetTabs             /api/run  ──┐      │
     ▼          │  /compare     Rosetta    WindowDesk, CodeWindow (CM6)                  │      │
scripts/        │  /genome      Traits     TraitMatrix, TraitSpace (PCA)                 │      │
 build-db.ts    │  /concept/:id Gene       GeneSpread, AdoptionChart                     │      │
     │          │  /play        Playground CodeWindow + RunPanel                         │      │
     ▼          └────────────────────────────────────────────────────────────────────────│──────┘
dist/world.json ──► loaded once at server start                                          │ HTTP/SSE
dist/pl.db      ──► FTS5 search, ad-hoc queries                                          ▼
                ┌──────────────────────── runner/ (Deno service, owns the docker socket) ──────┐
                │ POST /run {lang, code, stdin?} → queue → docker run plw-<lang> (hardened)    │
                │ streams stdout/stderr/exit/time as SSE; per-lang concurrency + global quota  │
                └──────────────────────────────────────────────────────────────────────────────┘
                browser fast-path: JS/TS native, Python (Pyodide), Ruby (ruby.wasm), Lua (wasmoon),
                Scheme, Prolog (SWI wasm), APL (ngn/apl) run client-side — no server round trip.
```

- **Why a separate runner service:** the web app never touches Docker. The runner can live on a different host, be
  scaled independently, and have the only privileged access.
- **Data pipeline:** `data/languages/*.json` (edited by hand/PR) → `deno task validate` → `deno task build:db` →
  `dist/`. The app loads `world.json` at startup; SQLite is for search and exploration
  queries. <!--languages-->76<!--/--> languages ≈ a few hundred KB, so everything fits in memory.

## 2. Data model (see `data/schema.ts`)

| Entity               | Notes                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Language**         | year, designers, org, tagline/summary/history, paradigms, typing, memory, execution, status, milestones, trivia, links, sources                                                                                                                      |
| **Lineage edge**     | parent → child with `kind` (influence · successor · dialect · superset · platform) and `weight` (major/minor); `primary_parent` gives a clean spanning tree                                                                                          |
| **Concept ("gene")** | <!--concepts-->56<!--/--> of them across control · types · abstraction · functional · memory · concurrency · metaprogramming · paradigm · syntax, each with an origin (language or external precursor) and popularizers                              |
| **Trait**            | language × concept → `core` / `supported` / `library` + `since`/`version` — so we know _when_ Java got lambdas                                                                                                                                       |
| **Task / Snippet**   | <!--tasks-->6<!--/--> shared tasks (hello, factorial, fizzbuzz, map&filter, shapes, signature) × <!--languages-->76<!--/--> languages, each with `expected_output` and `verified`; signature snippets tag the concepts they demonstrate (`concepts`) |
| **Runtime**          | the toolchain + Docker image that actually ran the snippets, and an optional in-browser engine                                                                                                                                                       |

## 3. Views

### 3.1 The River (home) — time × family

Horizontal time axis 1955 → today; one swimlane per family (Fortran, ALGOL, C, Lisp, ML, Smalltalk, logic, array,
scripting…). Languages are nodes at their birth year; lineage edges are curves that cross lanes when ideas jump
families.

```
       1960        1970        1980        1990        2000        2010        2020
ALGOL  ●ALGOL60──●ALGOL68──●Pascal──●Modula-2   ●Ada
           ╲         ╲ ╲
C           ●BCPL──●B──●C──────────●C++─────────●Java───●C#     ●Go  ●Rust  ●Zig
                           ╲          ╲            ╲
Lisp  ●Lisp────────────────●Scheme───●Common Lisp    ●JavaScript──●TypeScript
ML                         ●ML─────●Miranda──●Haskell  ●OCaml──●F#
...
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━]  ◄ time scrubber: "the world in 1985"
```

- Hover a node → its ancestors light up in one colour and its descendants in another.
- **Time scrubber:** drag to a year and later languages fade out, so you see the world as a programmer did in 1985.
  Concept origins appear as small markers on the axis.
- Filter chips: paradigm, typing, memory model, status; edge kinds on/off; "major only".

### 3.2 Genealogy — the family tree

Two layouts of the same data, toggleable:

- **Tree** (primary parents only): a clean radial or left-to-right dendrogram rooted at Fortran / Lisp / APL / COBOL…
- **Web** (all edges): a layered DAG (elkjs `layered`), with edge style by kind: solid = successor, dashed = influence,
  double = superset, dotted = platform.

Select a language to get a **pedigree view**: ancestors up to 3 generations above it and descendants below, like a
family chart, with the edge notes ("C began as NB — new B").

### 3.3 Language page — `/lang/c`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ C  1972 · Dennis Ritchie · Bell Labs                         ● active  C23   │
│ "A portable, close-to-the-metal systems language that became the lingua…"    │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ DNA  ▮▮▯▮▯▯│▮▯▯▯▯▯▯▯▯│▯▯▯▯▯▯▯▮▯│▮▯▯▯▯▯│▯▯▮│▯▯▯▯│▯▯▯▯▮▯│▯▯▯▯▯▯               │
│      control  types    abstraction  func  mem conc  meta   paradigm         │
│ Parents:  B (successor) · BCPL · ALGOL 68 · Fortran                          │
│ Children: C++ · Objective-C · Java · JavaScript · C# · Go · Rust · Zig …     │
├───────────────────────────────┴──────────────────────────────────────────────┤
│ [hello] [factorial] [fizzbuzz] [map&filter] [shapes] [★ signature]          │
│ ┌────────────────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ #include <stdio.h>                      │ │ ▶ Run   gcc 14 · 212 ms      │ │
│ │ int main(void) { ...                    │ │ Hello, World!                │ │
│ └────────────────────────────────────────┘ └──────────────────────────────┘ │
│ Innovations · History · Milestones (mini-timeline) · Trivia · Sources        │
└──────────────────────────────────────────────────────────────────────────────┘
```

The **DNA strip** is the signature visual: <!--concepts-->56<!--/--> cells grouped by concept category, filled solid for
`core`, half for `supported`, outlined for `library`. Hovering a cell shows the trait note and `since` ("C11:
`_Generic`"). The same strip appears everywhere a language is listed, so similarities become visible at a glance.

### 3.4 Rosetta Desk — the compare windows (`/compare?l=c,lisp,haskell,apl&t=shapes`)

The centrepiece: a desktop of code windows.

```
┌─ C (1972) ──────────── _ □ x ┐┌─ Lisp (1958) ─────────── _ □ x ┐┌─ APL (1966) ───── _ □ x ┐
│ typedef struct {             ││ (DEFINE (AREA S)               ││ area ← {×/⍵}             │
│   Kind kind; union {...};    ││   (COND ((EQ (CAR S) ...       ││ ...                      │
│ ...                          ││ ...                            ││                          │
│──────────────────────────────││────────────────────────────────││──────────────────────────│
│ ▶ Rectangle: 12              ││ ▶ Rectangle: 12                ││ ▶ Rectangle: 12          │
│   Triangle: 15    gcc 38ms   ││   Triangle: 15     sbcl 90ms   ││   Triangle: 15  apl 40ms │
└──────────────────────────────┘└────────────────────────────────┘└──────────────────────────┘
 Task: [shapes ▾]   Layout: [▥ 3-up] [▦ 2×2] [floating]   Period skins: [on]   ▶ Run all
 ┌ Trait diff ─────────────────────────────────────────────────────────────────────────────┐
 │ shared: recursion, first-class-functions      only C: pointers, static-typing            │
 │ only Lisp: macros, homoiconicity, gc          only APL: array-programming                │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

- Windows can be tiled (2-up, 3-up, 2×2) or floating (draggable and resizable, like a desktop). You can pin, reorder and
  swap the language in a window.
- **Period skins (optional):** each window's chrome matches the language's era. Punch-card / teletype paper for the
  1950s–60s, green or amber phosphor for the 70s, a classic Mac/NeXT bezel for the 80s, a 90s IDE, and a modern editor
  for today. Turn it off for a clean look.
- The code is editable. Run executes your edit, and the output is diffed against `expected_output` (✓ or a highlighted
  diff).
- A **trait diff** bar under the windows shows the traits the languages share and the ones that are unique to each.
- The share URL encodes the languages, the task and any edited code (compressed).

### 3.5 Genome — traits as genetics (`/genome`)

- **Trait matrix:** <!--languages-->76<!--/--> languages × <!--concepts-->56<!--/--> concepts, as a heat grid. Sort by
  year, family or trait similarity. Clicking a column opens that concept.
- **Phenotype vs genealogy:** cluster the languages by trait similarity (Jaccard or cosine over the trait vectors) and
  draw that dendrogram _next to_ the declared-lineage tree. Where they disagree you get **convergent evolution**: Rust
  and Haskell share traits but aren't close relatives, and Swift looks like Rust more than like its parent Objective-C.
- **Language space:** a 2D projection (PCA/UMAP) of the trait vectors, animated by year so you can watch the space fill
  in.

### 3.6 Concept pages — how a gene spreads (`/concept/closures`)

- Origin card: Scheme 1975 (Landin's precursor idea from 1964), plus popularizers.
- **Gene spread:** the River with only the languages that carry the trait highlighted, animated by `since`, so you watch
  closures reach Java 8 in 2014 and C++11 in 2011.
- An adoption curve (languages with the trait over time, stacked by core / supported / library) and the snippets built
  around the concept: signature snippets tagged with it, else the origin's and popularizers' take on the task where it
  shows up (recursion → factorial, closures → map & filter, classes → shapes), with a link to compare more in the
  Rosetta Desk.

### 3.7 Playground (`/play/:lang`)

Pick any language and write any code. It runs in the sandbox or in the browser, and shows the toolchain version, run
time and exit code.

### 3.8 Global

⌘K command palette: search languages, concepts, people and tasks (SQLite FTS5). Keyboard-first navigation, deep links
everywhere, dark by default, and a light "paper" theme.

## 4. Sandbox runner

Images are public ones (`gcc:14`, `haskell:9`, …) or, where none is usable, `plw-<id>` built from
`sandbox/<id>/Dockerfile`, as recorded in each language's `runtime.toolchains`. Each run (`runner/sandbox.ts`, as
implemented for local use):

```
docker run --rm -i --pull never --network none \
  --memory 1g --memory-swap 1g --cpus 2 --pids-limit 512 \
  --cap-drop ALL --security-opt no-new-privileges \
  --tmpfs /src:rw,exec,size=256m --tmpfs /tmp:rw,exec,size=256m \
  --entrypoint /bin/sh <image> -c "<script>"   # source on stdin, 90 s wall clock, docker kill on timeout
```

The script writes stdin to the right filename (`Main.java`, `main.fsx`, fixed-form `main.f`, etc.), runs the compile
step with its output on stderr, then runs the program. Marker lines on stderr (`\x1ePLW:ready|run|compile-failed`) split
the timings into startup, compile and run, and attribute failures to a phase. The runner streams
`start/phase/stdout/stderr/exit` as SSE, and `web/routes/api/run.ts` proxies it.

For a public deployment, tighten this to the target configuration:

```
docker run --rm --network none --read-only --tmpfs /tmp:size=64m,exec \
  --memory 256m --memory-swap 256m --cpus 1 --pids-limit 128 \
  --cap-drop ALL --security-opt no-new-privileges --user 65534:65534 \
  --runtime runsc   # gVisor: syscall-level isolation
```

- **Queueing:** per-language and global concurrency limits, and a per-IP rate limit in the web app. Output is capped at
  64 KB.
- **Latency:** most toolchains start in 0.3–1 s. For heavy ones (JVM, .NET, GHC, Swift) keep a small warm pool of paused
  containers per language, and hand each run a fresh container, never a reused one.
- **Verification harness:** `deno task verify` runs every snippet through the runner. It checks `expected_output`, flips
  `verified`, and reports diffs. In CI it doubles as the runner's integration test suite.
- **In-browser fast path:** where a credible WASM or JS engine exists, run it client-side. That's free, instant and
  works offline. The runner remains the fallback.
- **Alternative considered:** Piston or Judge0 (existing multi-language executors). They're good for mainstream
  languages but lack ALGOL 60, Simula, BCPL, B, CLU, Miranda and Self, so a small custom runner with our own images is
  simpler overall.

## 5. Frontend stack

| Concern      | Choice                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | Fresh 2 (Vite plugin, Preact islands, SSR routes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Graph layout | elkjs (layered DAG), d3-hierarchy (tree/radial), d3-zoom for pan/zoom                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Rendering    | SVG for up to ~200 nodes (accessible and stylable); canvas only if needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Code editor  | CodeMirror 6 + `@codemirror/legacy-modes`: every language but BCPL and CLU gets a mode (those two stay plain). Close relatives stand in where CodeMirror has none: BASIC, QBasic → VB, MATLAB → Octave, ALGOL family (incl. Oberon, Object Pascal) → Pascal, Ada → VHDL, Prolog → Erlang, Elixir → Ruby, Zig and Gleam → Rust, AWK → Perl, NewtonScript → JavaScript, Nim and Mojo → Python with their own keywords. Odin and V use the C-like factory with their own words. J, the xTalks (HyperTalk, AppleScript), Logo, Lean and Unison have small hand-written modes, and J, Dylan, Logo, Lean, Odin, Unison and V have hand-written highlight.js grammars; the word lists they share with the editor live in `web/lib/keywords.ts`. PHP uses `@codemirror/lang-php`. |
| Charts       | Observable Plot (adoption curves, trait space)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Search       | SQLite FTS5 via `node:sqlite` on the server                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Fonts        | a serif for history prose, a mono for code, APL-capable mono (APL385/BQN386) for APL windows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## 6. Roadmap

1. **Data** ✅ <!--languages-->76<!--/--> languages, <!--concepts-->56<!--/--> concepts, <!--edges-->374<!--/--> lineage
   edges (<!--cross-pollination-->26<!--/--> "cross-pollination": a newer language feeding a later version of an older
   one, e.g. Kotlin → PHP 8, drawn separately), <!--snippets-->456<!--/--> snippets (AppleScript's stay unverified: it
   exists only on macOS). <!--images-->43<!--/--> custom images in `sandbox/<id>/Dockerfile` (ALGOL 60 via MARST, Simula
   via Cim, LISP 1.5, BCPL, B, CLU, Self, Miranda, HyperTalk via LiveCode Server, Logo via a headless UCBLogo, QBasic
   via a patched QB64…). Static UI prototype: `design/prototype/` (`deno task prototype`).
2. **Skeleton app** ✅ Fresh 2 scaffold, world loader, language pages, River island, Genome matrix (SSR SVG), 404 page.
3. **Rosetta Desk** ✅ period-skinned windows, a CodeMirror 6 editor (`web/lib/editor.ts`), a language switcher, Run all
   and a trait diff. The editor loads only on the first Edit. Its tokens reuse the `hljs-*` classes, so period skins
   style it with no extra CSS. The editor supplies Tab/Shift-Tab with the snippet's own indent step, and Ctrl/⌘+Enter
   runs.
4. **Runner** ✅ local runner with SSE streaming. `deno task verify`
   passes <!--verified-->450<!--/-->/<!--runnable-->450<!--/--> runnable snippets on real toolchains. CI verifies the languages
   a pull request touches.
5. **Genealogy + Genome** ✅ `/tree` has three views. The family tree is a time-scaled dendrogram by primary parent. Its
   rows are an in-order walk, so no connector crosses a label. The influence web lays out
   all <!--forward-edges-->348<!--/--> non-retro edges top to bottom, using ELK `layered` at build time
   (`scripts/build-layout.ts`, so no elkjs in the app). Pedigrees show three generations up and two down, direct links
   include minor ones, and the edge notes are listed below the chart. The Genome matrix is also done. Still to do:
   phenotype vs genealogy.
6. **Concept pages** ✅ `/concepts` lists all <!--concepts-->56<!--/--> by category with an adoption sparkline.
   `/concept/:id` has the origin and popularizers, the carrier count by level, an SSR adoption curve, the River embedded
   with only this gene (play history to watch it spread), every carrier in the order it took the idea up with its note,
   the languages without it, and the concepts most often found with it (Jaccard over carriers). <!--tagged-->63<!--/-->
   signature snippets are tagged with the concepts they demonstrate (validated against the language's traits, and in
   `pl.db` as `snippet_concepts`). Genome column labels, trait DNA cells and the River's gene card link to concept
   pages.
7. **Polish:** browser fast paths (Pyodide, ruby.wasm, …), warm pools for JVM/.NET/Swift, search (FTS5 API), shareable
   edited code.

Slowest runs (the snippet's full compile + run, warm Docker): Swift ~5 s, Kotlin ~5 s, Eiffel ~5 s, Scala ~4 s, C# ~2 s.
Zig (Debug builds) and Go (pre-warmed build cache) take under 1 s.

## 7. Open questions

- Hosting: **decided: read-only on Cloudflare Workers** (`deno task deploy`); code windows show recorded output and
  point to the repo for live runs. A public runner later needs gVisor, a non-root user, a read-only rootfs, quotas and
  abuse controls (§4).
- Scope growth: <!--languages-->76<!--/--> → 100+? Added so far: AWK, Object Pascal, Oberon, J, Racket, Nim, Dart,
  Gleam, HyperTalk, AppleScript, NewtonScript, Dylan, Mojo, Logo, Bourne shell, Lean, Odin, Unison, Elm, Crystal, Visual Basic (run as VB.NET), QBasic, MATLAB (run on GNU Octave), D, PowerShell, V.
  **Next up**, in order: Koka, Luau, Roc, Bend.
  Later: Idris 2, Pony, Nushell, GDScript, Carbon, WebAssembly text, Raku, Hare; historic gaps the data cites most:
  Modula-3, Mesa, ISWIM, Newsqueak, PL/I, SNOBOL. See "Adding a language" in `data/README.md`.
- Should edited code and saved comparisons be shareable accounts-free (URL only) or persisted?
