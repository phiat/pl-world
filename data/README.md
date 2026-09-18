# pl-world data

Source-of-truth data for the PL World explorer. JSON files are hand-editable and git-diffable;
`scripts/build-db.ts` compiles them into `pl.db` (SQLite) for querying.

| File | What |
| --- | --- |
| `schema.ts` | zod schema + TS types for everything below (the contract) |
| `languages/<id>.json` | one file per language (50 ids, listed in `schema.ts`) |
| `concepts.json` | 55 concepts ("genes"): origin language/year and popularizers |
| `tasks.json` | 6 comparison tasks every language implements (the "windows") |

`languages/c.json` is the **reference example** — match its depth and tone.

## Research conventions

**Facts.** Verify `year`, `designers`, `organization` and lineage against the Wikipedia article
(infobox "First appeared", "Designed by", "Influenced by", "Influenced") plus a second source
when facts are disputed (official history pages, HOPL papers, the designer's own writing).
Record every URL you relied on in `sources`. `year` = first public appearance; explain nuance
(design vs. implementation vs. 1.0) in `year_note`. Only include `trivia` you can source —
no folklore. Write in a neutral, encyclopedic, concise voice.

**Privacy.** Web requests (Wikipedia API etc.) use a generic User-Agent such as
`pl-world-research/0.1`. Never put personal details (names, emails) in headers or queries.

**Lineage.** `influenced_by` / `influenced` may only reference the 50 ids; everything else
goes in `influenced_by_external`. Choose `kind` carefully (`successor`, `dialect`, `superset`,
`platform`, otherwise `influence`) and `weight` (`major` = a defining ancestor, `minor` = a
borrowed feature). `primary_parent` is the single most direct ancestor among the 50 (it drives
the tree layout) — `null` only for true roots (e.g. Fortran, Lisp, APL).

**Traits.** Walk through *all 55* concepts in `concepts.json` for each language. Include a
concept only if present, with `level`:
`core` (central, idiomatic, built in) · `supported` (exists but limited or non-central) ·
`library` (standard or ubiquitous library). Describe the language **as it is today**, and use
`since` (year) + `version` when a feature arrived after the first release (e.g. Java lambdas:
`since: 2014, version: "Java 8"`). Use `note` for nuance. Omitted concept = absent.
If a language is the concept's `origin` or in `popularized_by`, it must have that trait.

**Snippets.** All 6 tasks from `tasks.json`; `expected_output` must match the task exactly
(`higher-order` prints `4 16 36 64 100`). Write idiomatic code that shows the language's
character — the point is side-by-side comparison, so an ML should look like ML and APL like APL.
For historical languages, use a classic dialect that a modern open-source implementation can
run (e.g. FORTRAN 77 fixed form for gfortran), name it in `dialect`, and mention in `notes`
how the original would have differed. Keep snippets short (usually < 25 lines).

**Verification.** Run every snippet you can. Set `verified: true` only when the output matched
exactly. Use host toolchains when present (gcc, clang, sbcl, scheme, python3, lua, java,
dotnet, ruby, node, deno, go, rustc, zig, erl/escript, elixir, clojure, perl, gnat, gforth,
sqlite3), otherwise pull a well-known Docker image and run with
`docker run --rm --network none -v "$DIR":/src -w /src <image> <cmd>`.
Never install packages on the host. Timebox toolchain hunting (~10 min per language);
unverified is fine, wrong is not.

**Runtime.** Record the toolchain that actually worked in `runtime.toolchains`
(`docker_image`, `compile`/`run` with `{file}` and `{out}` placeholders) — the sandbox runner
will use it. List an in-browser (WASM/JS) implementation in `runtime.browser` if a credible
one exists (Pyodide, ruby.wasm, wasmoon, BiwaScheme, SWI-Prolog WASM, …).

**Color.** GitHub linguist colours (null = pick a distinctive hex that fits the family):
`fortran #4d41b1, lisp #3fb68b, cobol null, algol60 #D1E0DB, apl #5A8164, basic #ff0000,
simula null, bcpl null, algol68 #D1E0DB, b null, pascal #E3F171, forth #341708, c #555555,
smalltalk #596706, prolog #74283c, ml #dc566d, sql #e38c00, clu null, scheme #1e4aec,
modula2 #10253f, ada #02f88c, objective-c #438eff, common-lisp #3fb68b, cpp #f34b7d,
miranda null, eiffel #4d6977, erlang #B83998, self #0579aa, perl #0298c3, haskell #5e5086,
python #3572A5, lua #000080, r #198CE7, java #b07219, javascript #f1e05a, ruby #701516,
php #4F5D95, ocaml #ef7a08, csharp #7355dd, scala #c22d40, fsharp #b845fc, clojure #db5855,
go #00ADD8, rust #dea584, kotlin #A97BFF, elixir #6e4a7e, julia #a270ba, typescript #3178c6,
swift #F05138, zig #ec915c`

**Validate** with `deno run -A scripts/validate.ts <id> [<id>...]` until it reports 0 errors.
