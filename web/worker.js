// Cloudflare Workers entry (see ../wrangler.jsonc): the Fresh production build behind an edge cache.
// Static files never reach this code: Workers Assets serves _fresh/client first.
//
// Pages depend only on the data baked into the build, so each Cloudflare location renders a URL once and then
// serves it from its cache. The deployed version's id is part of the cache key, so a deploy never serves old pages.
// Browsers get `no-cache` instead: a page names its build's hashed /assets/ files, which the next deploy removes.
import server from "./_fresh/server.js";

const EDGE_CACHE = "public, max-age=31536000, immutable";
const BROWSER_CACHE = "no-cache";

// Only a page from an earlier deploy asks for /assets/ files this build lacks. Earlier builds sent pages to
// browsers as immutable, so tell the browser to drop its cached copies and reload the page, once per session.
// The page's boot script does `import { boot } from client-entry` and `import Island from island`, so the stand-in
// module exports both, or the import would fail to link and the reload would never run.
const STALE_ASSET_SCRIPT =
  'try{if(!sessionStorage.getItem("plw-reloaded")){sessionStorage.setItem("plw-reloaded","1");location.reload()}}catch{}\n' +
  "export const boot = () => {};\nexport default null;\n";

/** @param {Response} response */
const forBrowser = (response) => {
  const copy = new Response(response.body, response);
  copy.headers.set("cache-control", BROWSER_CACHE);
  return copy;
};

export default {
  /** @param {Request} request @param {{ CF_VERSION_METADATA?: { id: string } }} env @param {ExecutionContext} ctx */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/assets/")) {
      const js = url.pathname.endsWith(".js");
      return new Response(js ? STALE_ASSET_SCRIPT : "", {
        status: js ? 200 : 404,
        headers: {
          "content-type": js ? "text/javascript; charset=utf-8" : "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "clear-site-data": '"cache"',
        },
      });
    }
    if (request.method !== "GET") return server.fetch(request);
    const key = new Request(`${url.origin}/__v/${env.CF_VERSION_METADATA?.id ?? "dev"}${url.pathname}${url.search}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return forBrowser(hit);
    const response = await server.fetch(request);
    if (response.status === 200 && response.headers.get("content-type")?.startsWith("text/html")) {
      const copy = new Response(response.clone().body, response);
      copy.headers.set("cache-control", EDGE_CACHE);
      ctx.waitUntil(cache.put(key, copy));
      return forBrowser(response);
    }
    return response;
  },
};
