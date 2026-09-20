// GET /api/languages/:id — the whole record, plus the lineage this language sits in.
import { define } from "../../../utils.ts";
import { json, notFound } from "../../../lib/api.ts";
import { byId, childrenOf, closestByTraits, laterInfluencesOf, parentsOf } from "../../../lib/world.ts";

export const handler = define.handlers({
  GET(ctx) {
    const id = ctx.params.id;
    const language = byId.get(id);
    if (!language) return notFound("language", id);
    const { origin } = ctx.url;
    return json({
      ...language,
      lineage: {
        parents: parentsOf(id),
        children: childrenOf(id),
        later_influences: laterInfluencesOf(id),
      },
      closest_by_traits: closestByTraits(id).map((c) => ({
        id: c.lang.id,
        name: c.lang.name,
        similarity: Number(c.sim.toFixed(4)),
        lineage_distance: c.dist ?? null,
      })),
      page: `${origin}/lang/${id}`,
      markdown: `${origin}/lang/${id} with Accept: text/markdown`,
    });
  },
});
