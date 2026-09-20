// GET /api/concepts — every concept in display order, with the language that originated it.
import { define } from "../../../utils.ts";
import { json } from "../../../lib/api.ts";
import { languages, orderedConcepts } from "../../../lib/world.ts";

export const handler = define.handlers({
  GET(ctx) {
    const { origin } = ctx.url;
    return json({
      count: orderedConcepts.length,
      concepts: orderedConcepts.map((c) => ({
        ...c,
        language_count: languages.filter((l) => l.traits[c.id]).length,
        url: `${origin}/api/concepts/${c.id}`,
        page: `${origin}/concept/${c.id}`,
      })),
    });
  },
});
