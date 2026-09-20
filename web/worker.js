// Cloudflare Workers entry (see ../wrangler.jsonc): the Fresh production build behind an edge cache.
// Static files never reach this code: Workers Assets serves _fresh/client first, and static/_headers gives
// those responses the same security headers this file gives the pages.
//
// Pages depend only on the data baked into the build, so each Cloudflare location renders a URL once and then
// serves it from its cache. The deployed version's id is part of the cache key, so a deploy never serves old pages.
// Browsers get `no-cache` instead: a page names its build's hashed /assets/ files, which the next deploy removes.
import server from "./_fresh/server.js";

const EDGE_CACHE = "public, max-age=31536000, immutable";
const BROWSER_CACHE = "no-cache";

/**
 * Sent with everything. `credentialless` rather than `require-corp` for COEP: it still cross-origin-isolates
 * the page, but a cross-origin subresource added later degrades to an uncredentialled load instead of
 * vanishing. Nothing on the site is framed or embeds a third party — the fonts are self-hosted.
 */
const SECURITY = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-embedder-policy": "credentialless",
  "cross-origin-resource-policy": "same-origin",
  "permissions-policy": "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), display-capture=(), " +
    "encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), hid=(), idle-detection=(), " +
    "interest-cohort=(), local-fonts=(), magnetometer=(), microphone=(), midi=(), payment=(), " +
    "picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), " +
    "xr-spatial-tracking=()",
};

/**
 * A page's only inline script is the one Fresh writes to boot its islands, and Fresh gives it a nonce — so
 * the policy needs no `unsafe-inline` for scripts. `style-src` still does: the components set positions and
 * colours through `style` attributes, which a nonce cannot cover.
 */
const csp = (nonce) =>
  [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

/** Nothing but a page needs to run anything, so JSON, Markdown and XML get a policy that permits nothing. */
const INERT_CSP = "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; sandbox";

/** @param {Response} response @param {string | null} [nonce] */
const secure = (response, nonce) => {
  const copy = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY)) copy.headers.set(name, value);
  const html = copy.headers.get("content-type")?.startsWith("text/html");
  copy.headers.set("content-security-policy", html ? csp(nonce) : INERT_CSP);
  return copy;
};

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

/** The same negotiation main.ts does, so a Markdown request and a browser request never share a cache entry. */
const wantsMarkdown = (accept) => !!accept?.includes("text/markdown");

export default {
  /** @param {Request} request @param {{ CF_VERSION_METADATA?: { id: string } }} env @param {ExecutionContext} ctx */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/assets/")) {
      const js = url.pathname.endsWith(".js");
      return secure(
        new Response(js ? STALE_ASSET_SCRIPT : "", {
          status: js ? 200 : 404,
          headers: {
            "content-type": js ? "text/javascript; charset=utf-8" : "text/plain; charset=utf-8",
            "cache-control": "no-store",
            "clear-site-data": '"cache"',
          },
        }),
      );
    }
    // A HEAD is answered by rendering the GET and dropping the body at the end: a scanner that probes with
    // HEAD should see the page's real headers, nonce and all. Rendering HEAD directly would hand the cache an
    // empty body under the key a later GET reads.
    const head = request.method === "HEAD";
    if (request.method !== "GET" && !head) return secure(await server.fetch(request));
    const bodyless = (response) => (head ? new Response(null, response) : response);

    const md = wantsMarkdown(request.headers.get("accept"));
    const key = new Request(
      `${url.origin}/__v/${env.CF_VERSION_METADATA?.id ?? "dev"}${md ? "/md" : ""}${url.pathname}${url.search}`,
    );
    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) return bodyless(forBrowser(hit));

    const response = await server.fetch(head ? new Request(url, { method: "GET", headers: request.headers }) : request);
    const type = response.headers.get("content-type") ?? "";
    if (response.status !== 200 || !(type.startsWith("text/html") || type.startsWith("text/markdown"))) {
      return bodyless(secure(response));
    }

    // Read the page rather than stream it: the nonce Fresh generated is in the body, and the policy that
    // names it has to be cached alongside it. The cost lands once per URL, per location, per deploy.
    const body = await response.text();
    const nonce = type.startsWith("text/html") ? body.match(/<script[^>]+nonce="([^"]+)"/)?.[1] ?? null : null;
    const built = secure(new Response(body, response), nonce);
    built.headers.set("vary", "Accept");
    // Point automated readers at the catalogue (RFC 9727) without losing Fresh's modulepreload hints.
    built.headers.append("link", `<${url.origin}/.well-known/api-catalog>; rel="api-catalog"`);

    const cached = new Response(body, built);
    cached.headers.set("cache-control", EDGE_CACHE);
    ctx.waitUntil(cache.put(key, cached));
    return bodyless(forBrowser(built));
  },
};
