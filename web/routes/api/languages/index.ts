// GET /api/languages — one line per language. `?full=1` returns the complete records instead (a few MB).
import { define } from "../../../utils.ts";
import { json } from "../../../lib/api.ts";
import { languages } from "../../../lib/world.ts";

export const handler = define.handlers({
  GET(ctx) {
    const { origin } = ctx.url;
    if (ctx.url.searchParams.get("full") === "1") {
      return json({ count: languages.length, languages });
    }
    return json({
      count: languages.length,
      languages: languages.map((l) => ({
        id: l.id,
        name: l.name,
        year: l.year,
        family: l.family,
        paradigms: l.paradigms,
        status: l.status,
        designers: l.designers,
        tagline: l.tagline,
        url: `${origin}/api/languages/${l.id}`,
        page: `${origin}/lang/${l.id}`,
      })),
    });
  },
});
