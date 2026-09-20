import { App, staticFiles } from "fresh";
import type { State } from "./utils.ts";
import { apiCatalog, llms, markdownFor, robots, securityTxt, sitemap } from "./lib/agent.ts";

export const app = new App<State>();

app.use(staticFiles());

/** Small, cacheable, readable from anywhere: none of these say anything the pages do not. */
const text = (body: string, type: string) =>
  new Response(body, {
    headers: {
      "content-type": `${type}; charset=utf-8`,
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });

// The files an automated reader looks for first. They are routes rather than static files so that each one
// describes the origin it was served from, which keeps preview deploys honest. See lib/agent.ts.
app.get("/robots.txt", (ctx) => text(robots(ctx.url.origin), "text/plain"));
app.get("/sitemap.xml", (ctx) => text(sitemap(ctx.url.origin), "application/xml"));
app.get("/llms.txt", (ctx) => text(llms(ctx.url.origin), "text/markdown"));
app.get("/.well-known/security.txt", (ctx) => text(securityTxt(ctx.url.origin), "text/plain"));
app.get(
  "/.well-known/api-catalog",
  (ctx) => text(JSON.stringify(apiCatalog(ctx.url.origin), null, 2) + "\n", "application/linkset+json"),
);

/**
 * True when the client would rather have Markdown than HTML. Browsers never ask for `text/markdown`, so this
 * only ever diverts an agent — but compare the q-values anyway, since `Accept: text/markdown, text/html` and
 * `Accept: text/html, text/markdown;q=0.1` mean opposite things.
 */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept?.includes("text/markdown")) return false;
  const q = (type: string) => {
    const entry = accept.split(",").map((s) => s.trim()).find((s) => s.startsWith(type));
    if (!entry) return 0;
    return Number(entry.match(/;\s*q=([\d.]+)/)?.[1] ?? 1);
  };
  const md = q("text/markdown");
  return md > 0 && md >= Math.max(q("text/html"), q("application/xhtml+xml"));
}

// Markdown for agents: every page has a Markdown form (lib/agent.ts), served from the same URL under
// content negotiation. `Vary` matters here — worker.js keys its edge cache on this too.
app.use((ctx) => {
  if (ctx.req.method === "GET" && prefersMarkdown(ctx.req.headers.get("accept"))) {
    const md = markdownFor(ctx.url);
    if (md) {
      const res = text(md, "text/markdown");
      res.headers.set("vary", "Accept");
      return res;
    }
  }
  return ctx.next();
});

app.fsRoutes();
