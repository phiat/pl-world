// Where the sandbox runner (runner/main.ts) lives, if anywhere. Server only.
//
// Locally it is 127.0.0.1:8787. Hosted copies (Cloudflare Workers) have no runner unless RUNNER_URL points at one;
// their code windows fall back to the recorded, verified output.

// Deno.env locally; process.env on Workers (nodejs_compat populates it from the worker's vars).
const env = (key: string): string | undefined =>
  globalThis.Deno?.env.get(key) ??
    (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[key];

export const RUNNER_URL: string | null = env("RUNNER_URL") ?? ("Deno" in globalThis ? "http://127.0.0.1:8787" : null);
