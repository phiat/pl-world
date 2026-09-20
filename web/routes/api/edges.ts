// GET /api/edges — the lineage graph: every parent → child link with the reason it is there.
// `?of=c` narrows it to the links that touch one language.
import { define } from "../../utils.ts";
import { json } from "../../lib/api.ts";
import { edges } from "../../lib/world.ts";

export const handler = define.handlers({
  GET(ctx) {
    const of = ctx.url.searchParams.get("of");
    const list = of ? edges.filter((e) => e.parent === of || e.child === of) : edges;
    return json({ count: list.length, ...(of ? { of } : {}), edges: list });
  },
});
