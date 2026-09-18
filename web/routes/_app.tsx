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
        <title>PL World</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans+Condensed:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&family=Courier+Prime:wght@400;700&family=VT323&display=swap"
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
