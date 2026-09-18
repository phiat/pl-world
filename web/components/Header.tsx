import FindLanguage from "../islands/FindLanguage.tsx";

const VIEWS = [["/", "River"], ["/compare", "Rosetta Desk"], ["/genome", "Genome"]] as const;

export function Header(
  { path, stats, languages }: {
    path: string;
    stats: { languages: number; concepts: number; snippets: number; verified: number };
    languages: { id: string; name: string; year: number; aliases: string[] }[];
  },
) {
  const current = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header class="top wrap">
      <a class="brand" href="/">
        <b>
          <span>PL</span>World
        </b>
        <small>{stats.languages} languages · {stats.concepts} concepts · {stats.snippets} runnable snippets</small>
      </a>
      <nav aria-label="Views">
        {VIEWS.map(([href, label]) => (
          <a key={href} href={href} aria-current={current(href) ? "page" : undefined}>{label}</a>
        ))}
      </nav>
      <FindLanguage languages={languages} />
    </header>
  );
}
