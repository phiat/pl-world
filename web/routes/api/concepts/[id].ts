// GET /api/concepts/:id — a concept and every language that has it, with how deeply.
import { define } from "../../../utils.ts";
import { json, notFound } from "../../../lib/api.ts";
import { conceptById, languages } from "../../../lib/world.ts";

export const handler = define.handlers({
  GET(ctx) {
    const id = ctx.params.id;
    const concept = conceptById.get(id);
    if (!concept) return notFound("concept", id);
    const { origin } = ctx.url;
    const has = languages.filter((l) => l.traits[id]);
    return json({
      ...concept,
      languages: has.map((l) => ({ id: l.id, name: l.name, year: l.year, ...l.traits[id] })),
      language_count: has.length,
      page: `${origin}/concept/${id}`,
    });
  },
});
