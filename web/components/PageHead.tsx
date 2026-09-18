import { Head } from "fresh/runtime";

/**
 * Per-page <title>, description and social-card tags. Fresh replaces the defaults in _app.tsx with these,
 * as long as they sit inside <Head>: a bare <title> in the body would lose to the one in <head>. The title is
 * keyed because Fresh matches unkeyed <title>s by tag, and an SVG tooltip <title> would otherwise take its place.
 */
export function PageHead({ title, description, url }: { title?: string; description: string; url: URL }) {
  const full = title ? `${title} · PL World` : "PL World: seventy years of programming languages";
  const canonical = url.origin + url.pathname + url.search;
  return (
    <Head>
      <title key="doc-title">{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${url.origin}/og.png`} />
    </Head>
  );
}
