// Cloudflare Workers entry (see ../wrangler.jsonc): the Fresh production build behind an edge cache.
// Static files never reach this code: Workers Assets serves _fresh/client first.
//
// Pages depend only on the data baked into the build, so each Cloudflare location renders a URL once and then
// serves it from its cache. The deployed version's id is part of the cache key, so a deploy never serves old pages.
import server from "./_fresh/server.js";

export default {
  /** @param {Request} request @param {{ CF_VERSION_METADATA?: { id: string } }} env @param {ExecutionContext} ctx */
  async fetch(request, env, ctx) {
    if (request.method !== "GET") return server.fetch(request);
    const url = new URL(request.url);
    const key = new Request(`${url.origin}/__v/${env.CF_VERSION_METADATA?.id ?? "dev"}${url.pathname}${url.search}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return hit;
    const response = await server.fetch(request);
    if (response.status === 200 && response.headers.get("content-type")?.startsWith("text/html")) {
      const copy = new Response(response.clone().body, response);
      copy.headers.set("cache-control", "public, max-age=31536000, immutable");
      ctx.waitUntil(cache.put(key, copy));
    }
    return response;
  },
};
