type Lang = { id: string; name: string; year: number; aliases: string[] };

export default function FindLanguage({ languages }: { languages: Lang[] }) {
  const go = (value: string) => {
    const v = value.trim().toLowerCase();
    if (!v) return;
    const l = languages.find((x) => x.name.toLowerCase() === v || x.aliases.some((a) => a.toLowerCase() === v)) ??
      languages.find((x) => x.name.toLowerCase().startsWith(v));
    if (l) location.assign(`/lang/${l.id}`);
  };
  return (
    <div class="find">
      <input
        id="find"
        list="langlist"
        placeholder="Find a language…"
        aria-label="Find a language"
        onChange={(e) => go(e.currentTarget.value)}
      />
      <datalist id="langlist">
        {languages.map((l) => <option key={l.id} value={l.name}>{l.year}</option>)}
      </datalist>
    </div>
  );
}
