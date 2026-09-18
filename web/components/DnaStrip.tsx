import { CATEGORIES, type ConceptLite, type TraitLite } from "../lib/meta.ts";

/** One cell per concept, grouped by category: solid = core, half = supported, dashed = library. */
export function DnaStrip(
  { traits, concepts, small = false }: {
    traits: Record<string, TraitLite | undefined>;
    concepts: ConceptLite[];
    small?: boolean;
  },
) {
  return (
    <div class={small ? "dna small" : "dna"}>
      {CATEGORIES.map(([cat, label, color]) => (
        <div class="grp" key={cat}>
          <div class="cells">
            {concepts.filter((c) => c.category === cat).map((c) => {
              const t = traits[c.id];
              const detail = t
                ? t.level + (t.version ? ` · ${t.version}` : t.since ? ` · since ${t.since}` : "") +
                  (t.note ? ` — ${t.note}` : "")
                : "absent";
              return (
                <a
                  key={c.id}
                  href={`/concept/${c.id}`}
                  class={`cell ${t?.level ?? ""}`}
                  style={`--cc:${color}`}
                  title={`${c.name}: ${detail}`}
                  aria-label={`${c.name}: ${detail}`}
                />
              );
            })}
          </div>
          <span class="lab">{label}</span>
        </div>
      ))}
    </div>
  );
}
