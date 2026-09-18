// Proxy to the local sandbox runner (runner/main.ts). The browser never talks to it directly.
import { define } from "../../utils.ts";

const RUNNER_URL = Deno.env.get("RUNNER_URL") ?? "http://127.0.0.1:8787";

export const handler = define.handlers({
  async POST(ctx) {
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
