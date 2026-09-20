import { define } from "../utils.ts";
import { Header } from "../components/Header.tsx";
import { languages, stats } from "../lib/world.ts";

const finder = languages.map((l) => ({ id: l.id, name: l.name, year: l.year, aliases: l.aliases }));

export default define.page(function App({ Component, url }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title key="doc-title">PL World</title>
        <meta
          name="description"
          content="An explorable museum of programming languages: lineage, traits and runnable code."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PL World" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
        {
          /* The fonts are self-hosted (see static/fonts/README.md), so there is no third-party origin to
            preconnect to. These two carry the body text and are worth fetching before the CSS names them. */
        }
        <link
          rel="preload"
          href="/fonts/ibm-plex-sans-condensed-400-latin.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ibm-plex-mono-400-latin.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
      </head>
      <body>
        <Header path={url.pathname} stats={stats} languages={finder} />
        <main>
          <Component />
        </main>
      </body>
    </html>
  );
});
