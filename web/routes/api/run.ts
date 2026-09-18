// Proxy to the sandbox runner (runner/main.ts). The browser never talks to it directly.
import { define } from "../../utils.ts";
import { REPO_URL } from "../../lib/meta.ts";
import { RUNNER_URL } from "../../lib/runner.ts";

export const handler = define.handlers({
  async POST(ctx) {
    // Same-origin JSON only: a cross-site form or text/plain POST must not reach the runner.
    const site = ctx.req.headers.get("sec-fetch-site");
    if ((site && site !== "same-origin") || !ctx.req.headers.get("content-type")?.startsWith("application/json")) {
      return Response.json({ error: "Cross-site or non-JSON requests are not accepted." }, { status: 403 });
    }
    if (!RUNNER_URL) {
      return Response.json(
        { error: `This copy of PL World can't run code. Clone ${REPO_URL} to run every window live.`, hosted: true },
        { status: 503 },
      );
    }
    try {
      const upstream = await fetch(`${RUNNER_URL}/run`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: ctx.req.headers.get("accept") ?? "application/json",
        },
        body: await ctx.req.text(),
        signal: ctx.req.signal,
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "application/json",
          "cache-control": "no-cache",
        },
      });
    } catch {
      return Response.json(
        { error: "The sandbox runner isn't running. Start it with `deno task runner` in the project root." },
        { status: 503 },
      );
    }
  },
});
