// Shared shape for the read-only JSON API under routes/api/. It is the same data the pages are built from,
// so it is cacheable for as long as a deploy lives and open to any origin: there is nothing here that is not
// already in the HTML, and an agent reading it from somewhere else should not need a proxy.
import { generatedAt } from "./world.ts";

/** A JSON body with the headers that make it usable from anywhere and cheap to re-fetch. */
export function json(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body, null, 2) + "\n", {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "cache-control": "public, max-age=3600",
      "x-data-generated-at": generatedAt,
    },
  });
}

export const notFound = (what: string, id: string) =>
  json({ error: `No ${what} with id "${id}".`, status: 404 }, { status: 404 });
