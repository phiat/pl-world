// GET /api — the service description the RFC 9727 catalogue points at: what is here and how to ask for it.
import { define } from "../../utils.ts";
import { json } from "../../lib/api.ts";
import { edges, generatedAt, languages, orderedConcepts, stats, tasks } from "../../lib/world.ts";
import { REPO_URL } from "../../lib/meta.ts";

export const handler = define.handlers({
  GET(ctx) {
    const { origin } = ctx.url;
    return json({
      name: "PL World",
      description: `An explorable museum of ${stats.languages} programming languages across seventy years: lineage, ` +
        `traits and runnable code.`,
      source: REPO_URL,
      license: `${REPO_URL}/blob/main/LICENSE`,
      generated_at: generatedAt,
      counts: {
        languages: languages.length,
        concepts: orderedConcepts.length,
        lineage_edges: edges.length,
        tasks: tasks.length,
        snippets: stats.snippets,
        verified_snippets: stats.verified,
      },
      endpoints: {
        languages: `${origin}/api/languages`,
        language: `${origin}/api/languages/{id}`,
        concepts: `${origin}/api/concepts`,
        concept: `${origin}/api/concepts/{id}`,
        edges: `${origin}/api/edges`,
        tasks: `${origin}/api/tasks`,
      },
      notes: [
        "Every HTML page is also served as Markdown: send `Accept: text/markdown`.",
        `${origin}/llms.txt indexes the site for language models.`,
      ],
    });
  },
});
