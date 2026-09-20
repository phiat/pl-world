// What an automated reader needs to find its way around: robots.txt, the sitemap, llms.txt, the RFC 9727 API
// catalogue, and a Markdown rendering of every page. Registered in main.ts (well-known paths and the
// `Accept: text/markdown` middleware); the JSON they point at lives in routes/api/.
//
// Everything here takes the request's origin rather than a baked-in domain, so a preview deploy describes
// itself and not production.
import { conceptById, concepts, edges, generatedAt, languages, orderedConcepts, stats, tasks } from "./world.ts";
import type { Concept, Language } from "./world.ts";
import { CATEGORY, FAMILY, REPO_URL } from "./meta.ts";

/** The pages a crawler should know about, beyond the per-language and per-concept ones. */
const SECTIONS = [
  ["/", "The River", "Every language on a time × family chart, with lineage links you can trace."],
  ["/tree", "Genealogy", "The family tree by primary parent, the full influence web, and per-language pedigrees."],
  ["/genome", "Genome", "The language × concept matrix, and languages that arrived at similar designs apart."],
  ["/concepts", "Concepts", "The ideas themselves: where each came from and which languages carry it."],
  ["/compare", "Rosetta Desk", "The same program in up to six languages side by side, with a trait diff."],
] as const;

const urls = (origin: string) => [
  ...SECTIONS.map(([path]) => origin + path),
  ...languages.map((l) => `${origin}/lang/${l.id}`),
  ...orderedConcepts.map((c) => `${origin}/concept/${c.id}`),
];

// ---------------------------------------------------------------------------------------------------------
// robots.txt

/**
 * Open to crawlers and to AI systems that read the site to answer a question; closed to training corpora.
 * The `Content-Signal` line states that in the vocabulary Cloudflare's scanner and a growing number of
 * crawlers read, and the per-agent groups below repeat it for the training-only bots that predate it.
 */
export const robots = (origin: string) =>
  `# PL World — an explorable museum of programming languages. ${REPO_URL}
#
# Content signals (contentsignals.org): search and AI answers are welcome and the data behind this site is
# free to reuse under the repository's licence; what is reserved is bulk collection for model training.
#   search=yes    index it, link to it, quote a snippet of it
#   ai-input=yes  read it to ground an answer, and cite it
#   ai-train=no   do not add it to a training or fine-tuning corpus
# The restriction is an express reservation of rights under Article 4 of EU Directive 2019/790.

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /api/run

# Crawlers that exist to collect training data, named explicitly because they predate Content-Signal.
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
User-agent: Bytespider
User-agent: meta-externalagent
User-agent: Omgilibot
Content-Signal: search=yes, ai-input=yes, ai-train=no
Disallow: /

# Assistants that fetch a page to answer someone's question are welcome.
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-User
User-agent: Claude-SearchBot
User-agent: PerplexityBot
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /api/run

Sitemap: ${origin}/sitemap.xml
`;

// ---------------------------------------------------------------------------------------------------------
// sitemap.xml

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Every page, dated by the build that produced the data, since that is the only thing that changes them. */
export const sitemap = (origin: string) => {
  const lastmod = generatedAt.slice(0, 10);
  const entry = (loc: string, priority: string) =>
    `  <url>\n    <loc>${xml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  const top = new Set(SECTIONS.map(([path]) => origin + path));
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls(origin).map((u) => entry(u, u === `${origin}/` ? "1.0" : top.has(u) ? "0.9" : "0.7")).join("\n") +
    `\n</urlset>\n`;
};

// ---------------------------------------------------------------------------------------------------------
// llms.txt

/** llmstxt.org's format: one H1, a blockquote summary, then link lists an LLM can walk. */
export const llms = (origin: string) =>
  `# PL World

> An explorable museum of ${stats.languages} programming languages across seventy years, from Fortran (1957) to
> Mojo (2023). It records where each language came from (lineage), what it is made of (${stats.concepts} language
> concepts, recorded per language as traits), and how it reads: the same ${tasks.length} programs written in every
> language, ${stats.verified} of the ${stats.snippets} snippets verified by running them on the language's real
> toolchain in a container.

Every page on this site is also served as Markdown: request it with \`Accept: text/markdown\`. The same data is
available as JSON under \`/api\` — see [the API catalogue](${origin}/.well-known/api-catalog). The data set is
open and versioned at ${REPO_URL}.

## Data

- [Languages index](${origin}/api/languages): every language with its year, family, paradigms and tagline.
- [One language](${origin}/api/languages/c): the full record — history, innovations, typing, memory model,
  lineage with reasons, traits, code snippets and milestones.
- [Concepts index](${origin}/api/concepts): the ${stats.concepts} concepts, each with its origin language and year.
- [One concept](${origin}/api/concepts/closures): a concept, who popularised it, and every language that has it.
- [Lineage edges](${origin}/api/edges): the ${edges.length} parent → child influence links, each with its reason.

## Pages

${SECTIONS.map(([path, name, what]) => `- [${name}](${origin}${path}): ${what}`).join("\n")}

## Languages

${languages.map((l) => `- [${l.name} (${l.year})](${origin}/lang/${l.id}): ${l.tagline}`).join("\n")}

## Concepts

${orderedConcepts.map((c) => `- [${c.name}](${origin}/concept/${c.id}): ${c.summary}`).join("\n")}
`;

// ---------------------------------------------------------------------------------------------------------
// /.well-known/security.txt (RFC 9116)

/**
 * Where to report something. The repository's private advisory form rather than an address, so there is no
 * inbox to scrape. `Expires` is mandatory and has to be under a year out, so it is dated from the build:
 * a deploy renews it, and a site left untouched for a year correctly stops claiming the contact is current.
 */
export const securityTxt = (origin: string) => {
  const expires = new Date(generatedAt);
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  return `Contact: ${REPO_URL}/security/advisories/new
Expires: ${expires.toISOString().replace(/\.\d+Z$/, "Z")}
Preferred-Languages: en
Canonical: ${origin}/.well-known/security.txt

# PL World is a static museum of programming languages: it stores nothing, authenticates no one, and the
# whole of it is public at ${REPO_URL}. Code submitted to a code window is run only by a local sandbox
# runner, which this deployment does not have.
`;
};

// ---------------------------------------------------------------------------------------------------------
// /.well-known/api-catalog (RFC 9727), served as application/linkset+json

export const apiCatalog = (origin: string) => ({
  linkset: [{
    anchor: `${origin}/`,
    "service-desc": [
      { href: `${origin}/api`, type: "application/json", title: "PL World read-only JSON API" },
    ],
    "service-doc": [
      { href: `${origin}/llms.txt`, type: "text/markdown", title: "PL World for language models" },
      { href: `${REPO_URL}#readme`, type: "text/html", title: "PL World on GitHub" },
    ],
    author: [{ href: REPO_URL }],
    license: [{ href: `${REPO_URL}/blob/main/LICENSE` }],
  }],
});

// ---------------------------------------------------------------------------------------------------------
// Markdown

/** A fence long enough to survive whatever backticks the snippet itself contains. */
const fence = (code: string) => "`".repeat(Math.max(3, ...[...code.matchAll(/`+/g)].map((m) => m[0].length + 1)));

const heading = (l: Language) => {
  const who = l.designers.join(", ") + (l.organization ? ` at ${l.organization}` : "");
  return `# ${l.name} (${l.year})\n\n> ${l.tagline}\n\nDesigned by ${who}.`;
};

const traitLines = (l: Language) => {
  const out: string[] = [];
  for (const [cat, label] of Object.entries(CATEGORY).map(([k, v]) => [k, v.label] as const)) {
    const had = concepts.filter((c) => c.category === cat && l.traits[c.id]);
    if (!had.length) continue;
    out.push(
      `**${label}.** ` + had.map((c) => {
        const t = l.traits[c.id]!;
        const when = t.version ? ` (${t.version})` : t.since ? ` (since ${t.since})` : "";
        return `${c.name} — ${t.level}${when}`;
      }).join("; ") + ".",
    );
  }
  return out.join("\n\n");
};

function languageMarkdown(l: Language, origin: string): string {
  const parents = edges.filter((e) => e.child === l.id && !e.retro);
  const children = edges.filter((e) => e.parent === l.id && !e.retro);
  const name = (id: string) => languages.find((o) => o.id === id)?.name ?? id;
  const parts = [
    heading(l),
    `## Summary\n\n${l.summary}`,
    `## History\n\n${l.history}`,
    `## What it introduced\n\n${l.innovations.map((i) => `- ${i}`).join("\n")}`,
    `## Design\n\n` + [
      `- **Family:** ${FAMILY[l.family]?.label ?? l.family}`,
      `- **Paradigms:** ${l.paradigms.join(", ")}`,
      `- **Typing:** ${l.typing.discipline}, ${l.typing.strength}, ${l.typing.inference} inference, ` +
      `${l.typing.equivalence} equivalence${l.typing.notes ? ` — ${l.typing.notes}` : ""}`,
      `- **Memory:** ${l.memory}${l.memory_note ? ` — ${l.memory_note}` : ""}`,
      `- **Execution:** ${l.execution.join(", ")}`,
      `- **Status:** ${l.status}${l.latest_version ? `, latest ${l.latest_version}` : ""}`,
      `- **File extensions:** ${l.file_extensions.join(", ")}`,
    ].join("\n"),
    parents.length
      ? `## Came from\n\n` +
        parents.map((e) => `- **${name(e.parent)}** (${e.kind}, ${e.weight})${e.note ? ` — ${e.note}` : ""}`)
          .join("\n")
      : "",
    children.length
      ? `## Led to\n\n${children.map((e) => `- ${name(e.child)}`).join(", ").replace(/, - /g, ", ")}`
      : "",
    `## Traits\n\n${traitLines(l)}`,
    `## Code\n\n` + tasks.filter((t) => l.snippets[t.id]).map((t) => {
      const s = l.snippets[t.id]!;
      const f = fence(s.code);
      return `### ${s.title ?? t.name}\n\n${t.prompt}\n\n_${s.dialect}${
        s.verified ? ", verified on a real toolchain" : ""
      }._` +
        `${s.notes ? ` ${s.notes}` : ""}\n\n${f}${l.id}\n${s.code.replace(/\n$/, "")}\n${f}\n\nOutput:\n\n` +
        `${f}\n${s.expected_output.replace(/\n$/, "")}\n${f}`;
    }).join("\n\n"),
    `## Milestones\n\n${l.milestones.map((m) => `- **${m.year}** — ${m.event}`).join("\n")}`,
    l.trivia?.length ? `## Trivia\n\n${l.trivia.map((t) => `- ${t}`).join("\n")}` : "",
    `## Links\n\n` + [
      l.links.homepage && `- [Homepage](${l.links.homepage})`,
      l.links.spec && `- [Specification](${l.links.spec})`,
      l.links.wikipedia && `- [Wikipedia](${l.links.wikipedia})`,
      `- [This page as JSON](${origin}/api/languages/${l.id})`,
      `- [This page in a browser](${origin}/lang/${l.id})`,
    ].filter(Boolean).join("\n"),
  ];
  return parts.filter(Boolean).join("\n\n") + "\n";
}

function conceptMarkdown(c: Concept, origin: string): string {
  const has = languages.filter((l) => l.traits[c.id]);
  const name = (id: string) => languages.find((o) => o.id === id)?.name ?? id;
  const from = c.origin.lang ? `${name(c.origin.lang)} (${c.origin.year})` : `${c.origin.external} (${c.origin.year})`;
  return [
    `# ${c.name}\n\n> ${c.summary}`,
    `- **Category:** ${CATEGORY[c.category]?.label ?? c.category}`,
    `- **Origin:** ${from}${c.origin.note ? ` — ${c.origin.note}` : ""}`,
    `- **Popularised by:** ${c.popularized_by.map(name).join(", ") || "—"}`,
    `## Languages with it (${has.length})\n\n` + has.map((l) => {
      const t = l.traits[c.id]!;
      const when = t.version ? ` (${t.version})` : t.since ? ` (since ${t.since})` : "";
      return `- **${l.name}** — ${t.level}${when}${t.note ? `: ${t.note}` : ""}`;
    }).join("\n"),
    `## Links\n\n- [This page as JSON](${origin}/api/concepts/${c.id})\n` +
    `- [This page in a browser](${origin}/concept/${c.id})`,
  ].join("\n\n") + "\n";
}

function indexMarkdown(origin: string): string {
  return `# PL World

> An explorable museum of ${stats.languages} programming languages across seventy years, from Fortran (1957) to
> Mojo (2023): where each came from, what it is made of, and how it reads.

${stats.languages} languages, ${stats.concepts} concepts recorded as traits, ${edges.length} lineage links, and
${stats.snippets} code snippets — ${stats.verified} of them verified by running on the language's real toolchain.

## Sections

${SECTIONS.map(([path, name, what]) => `- [${name}](${origin}${path}) — ${what}`).join("\n")}

## For automated readers

- Every page answers \`Accept: text/markdown\` with the page as Markdown.
- [llms.txt](${origin}/llms.txt) indexes the whole site.
- [API catalogue](${origin}/.well-known/api-catalog) (RFC 9727) points at the read-only JSON API under \`/api\`.
- [sitemap.xml](${origin}/sitemap.xml) lists all ${urls(origin).length} pages.

## Languages by decade

${
    [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => {
      const inDecade = languages.filter((l) => l.year >= d && l.year < d + 10);
      return inDecade.length
        ? `**${d}s.** ` + inDecade.map((l) => `[${l.name}](${origin}/lang/${l.id})`).join(", ")
        : "";
    }).filter(Boolean).join("\n\n")
  }

## Concepts

${orderedConcepts.map((c) => `- [${c.name}](${origin}/concept/${c.id}) — ${c.summary}`).join("\n")}
`;
}

/** The Markdown form of a page, or null if that path has none and should be served as HTML. */
export function markdownFor(url: URL): string | null {
  const { origin, pathname } = url;
  if (pathname === "/") return indexMarkdown(origin);

  const lang = pathname.match(/^\/lang\/([^/]+)\/?$/)?.[1];
  if (lang) {
    const l = languages.find((o) => o.id === lang);
    return l ? languageMarkdown(l, origin) : null;
  }

  const concept = pathname.match(/^\/concept\/([^/]+)\/?$/)?.[1];
  if (concept) {
    const c = conceptById.get(concept);
    return c ? conceptMarkdown(c, origin) : null;
  }

  if (pathname === "/concepts") {
    return `# Concepts\n\n> The ${stats.concepts} ideas this museum tracks, grouped by what they are about.\n\n` +
      Object.entries(CATEGORY).map(([cat, { label }]) => {
        const inCat = orderedConcepts.filter((c) => c.category === cat);
        if (!inCat.length) return "";
        return `## ${label}\n\n` +
          inCat.map((c) => `- [${c.name}](${origin}/concept/${c.id}) — ${c.summary}`).join("\n");
      }).filter(Boolean).join("\n\n") + "\n";
  }

  const section = SECTIONS.find(([path]) => path === pathname);
  if (section) {
    return `# ${section[1]}\n\n> ${section[2]}\n\nThis page is a chart, and a chart does not survive the trip to\n` +
      `Markdown. The data behind it is in the JSON API — see [the API catalogue](${origin}/.well-known/api-catalog)\n` +
      `— and [llms.txt](${origin}/llms.txt) indexes the site.\n`;
  }
  return null;
}
