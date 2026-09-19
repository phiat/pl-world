// Capture the README screenshots (docs/screenshots/*.png) and the social card (web/static/og.png) from a running site.
// Start it first with `deno task dev`: the Rosetta Desk and language page shots run their snippets on the runner.
// Uses the Playwright Chromium build in ~/.cache/ms-playwright (`npx playwright@1.62.1 install chromium` if missing).
//   deno task screenshots                                   # all shots from http://127.0.0.1:8000
//   deno task screenshots http://127.0.0.1:8000 river genome   # just these
import { chromium, type Page } from "playwright";

type Shot = {
  file: string;
  path: string;
  dark?: boolean;
  og?: boolean;
  /** Put the page in the state the image shows, after it has loaded and hydrated. */
  prepare?: (page: Page) => Promise<void>;
};

// Nodes trace their lineage on focus as well as hover; focusing without scrolling keeps the framing at the top.
const trace = (name: string) => async (page: Page) => {
  await page.locator(`[aria-label^="${name}, "]`).first().evaluate((el) =>
    (el as HTMLElement).focus({ preventScroll: true })
  );
  await page.locator(".tracing").first().waitFor();
};

// Run snippets and wait until every window has finished and matched its expected output.
const runAll = (windows: number, start: (page: Page) => Promise<void>) => async (page: Page) => {
  await start(page);
  await page.waitForFunction((n) => document.querySelectorAll(".win-out .status .ok").length >= n, windows, {
    timeout: 180_000,
  });
};

const SHOTS: Shot[] = [
  { file: "docs/screenshots/river.png", path: "/?gene=closures", prepare: trace("C") },
  { file: "web/static/og.png", path: "/?gene=closures", og: true, prepare: trace("C") },
  {
    file: "docs/screenshots/rosetta-desk.png",
    path: "/compare?l=fortran,c,smalltalk,haskell,rust&t=shapes",
    dark: true,
    prepare: runAll(5, (page) => page.getByRole("button", { name: "▶ Run all" }).click()),
  },
  {
    file: "docs/screenshots/language-page.png",
    path: "/lang/haskell?task=higher-order",
    prepare: runAll(1, (page) => page.locator("button.run").first().click()),
  },
  { file: "docs/screenshots/family-tree.png", path: "/tree", prepare: trace("Java") },
  { file: "docs/screenshots/pedigree.png", path: "/tree?of=python", dark: true },
  { file: "docs/screenshots/genome.png", path: "/genome?sort=sim&to=haskell" },
  { file: "docs/screenshots/concept-page.png", path: "/concept/actors" },
];

const [base = "http://127.0.0.1:8000", ...only] = Deno.args;
const shots = only.length ? SHOTS.filter((s) => only.some((o) => s.file.includes(o))) : SHOTS;
const root = new URL("../", import.meta.url);

const browser = await chromium.launch();
try {
  for (const s of shots) {
    // Playwright's stock Chromium User-Agent gets the same Google Fonts subsets as visitors (a custom one gets a
    // single TTF whose glyphs differ, e.g. ✓).
    const page = await browser.newPage({
      viewport: s.og ? { width: 1200, height: 630 } : { width: 1280, height: 800 },
      colorScheme: s.dark ? "dark" : "light",
    });
    await page.goto(new URL(s.path, base).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await s.prepare?.(page);
    await page.screenshot({ path: new URL(s.file, root).pathname, animations: "disabled" });
    await page.close();
    console.log(`${s.file}  ← ${s.path}`);
  }
} finally {
  await browser.close();
}
