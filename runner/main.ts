// Local sandbox runner. Binds to 127.0.0.1 only; the web app proxies /api/run to it.
//   deno task runner            (PORT=8787 by default)
//
//   GET  /health     → { ok, docker }
//   GET  /languages  → [{ id, name, image, toolchain, available }]
//   POST /run        { lang, code } → RunResult JSON
//                    with `Accept: text/event-stream` → SSE: start, phase, stdout, stderr, exit
import { loadWorld } from "../data/world.ts";
import { localImages, Sandbox, UnknownLanguageError, withTag } from "./sandbox.ts";

const MAX_CODE_BYTES = 64 * 1024;
const port = Number(Deno.env.get("PORT") ?? 8787);

const world = await loadWorld();
const sandbox = new Sandbox(world.languages, {
  timeoutMs: Number(Deno.env.get("RUN_TIMEOUT_MS") ?? 90_000),
});

let imageCache: { at: number; images: Set<string> } | null = null;
async function images() {
  if (!imageCache || Date.now() - imageCache.at > 15_000) imageCache = { at: Date.now(), images: await localImages() };
  return imageCache.images;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function handleRun(req: Request): Promise<Response> {
  let body: { lang?: unknown; code?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON: { lang, code }" }, 400);
  }
  const { lang, code } = body;
  if (typeof lang !== "string" || typeof code !== "string") {
    return json({ error: "lang and code must be strings" }, 400);
  }
  if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) return json({ error: "code is larger than 64 KB" }, 413);
  let plan;
  try {
    plan = sandbox.plan(lang, code);
  } catch (e) {
    if (e instanceof UnknownLanguageError) return json({ error: e.message }, 404);
    throw e;
  }
  if (!(await images()).has(withTag(plan.image))) {
    return json({ error: `Image ${plan.image} is not built yet. Run: deno task images ${lang}` }, 503);
  }

  if (!req.headers.get("accept")?.includes("text/event-stream")) {
    return json(await sandbox.run({ lang, code }, undefined, req.signal));
  }
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { /* client went away */ }
      };
      sandbox.run({ lang, code }, (e) => send(e.type, e), req.signal)
        .catch((err) => send("error", { message: String(err) }))
        .finally(() => {
          try {
            controller.close();
          } catch { /* already closed */ }
        });
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
}

Deno.serve({ hostname: "127.0.0.1", port }, async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET" && url.pathname === "/health") {
    const v = await new Deno.Command("docker", {
      args: ["version", "--format", "{{.Server.Version}}"],
      stdout: "piped",
      stderr: "null",
    })
      .output().catch(() => null);
    return json({ ok: !!v?.success, docker: v?.success ? new TextDecoder().decode(v.stdout).trim() : null });
  }
  if (req.method === "GET" && url.pathname === "/languages") {
    const have = await images();
    return json(
      sandbox.languages().map((l) => {
        const t = l.runtime.toolchains.find((t) => t.docker_image);
        return {
          id: l.id,
          name: l.name,
          image: t?.docker_image ?? null,
          toolchain: t ? [t.name, t.version].filter(Boolean).join(" ") : null,
          available: !!t?.docker_image && have.has(withTag(t.docker_image)),
        };
      }),
    );
  }
  if (req.method === "POST" && url.pathname === "/run") return handleRun(req);
  return json({ error: "not found" }, 404);
});
