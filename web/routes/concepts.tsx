import { define } from "../utils.ts";
import { AdoptionSpark } from "../components/AdoptionChart.tsx";
import { PageHead } from "../components/PageHead.tsx";
import { byId, languages } from "../lib/world.ts";
import { adoptionOf, conceptIndex } from "../lib/concepts.ts";
import { CATEGORIES } from "../lib/meta.ts";

export default define.page(function Concepts({ url }) {
  return (
    <section class="wrap concepts">
      <PageHead
        title="Concepts"
        description={`${conceptIndex.length} ideas that programming languages pass on: where each came from and how far it spread.`}
        url={url}
      />
      <div class="desk-bar">
        <h2>Concepts</h2>
        <p class="note">
          {conceptIndex.length} ideas that languages pass on, where each came from and how far it spread among these
          {" "}
          {languages.length}. The shaded curve is carriers over time against languages in existence.
        </p>
      </div>
      <nav class="cat-nav" aria-label="Categories">
        {CATEGORIES.map(([cat, label, color]) => <a key={cat} href={`#${cat}`} style={`--cc:${color}`}>{label}</a>)}
      </nav>
      {CATEGORIES.map(([cat, label, color]) => (
        <section key={cat} id={cat} class="cat" style={`--cc:${color}`}>
          <h3>{label}</h3>
          <ul class="concept-list">
            {conceptIndex.filter((x) => x.concept.category === cat).map(({ concept: c, carriers }) => (
              <li key={c.id}>
                <a href={`/concept/${c.id}`}>
                  <b>{c.name}</b>
                  <span class="origin">
                    {c.origin.year} · {c.origin.lang ? byId.get(c.origin.lang)?.name : c.origin.external}
                  </span>
                  <span class="sum">{c.summary}</span>
                  <span class="spread">
                    <AdoptionSpark points={adoptionOf(c.id)} color={color} max={languages.length} />
                    <small>
                      <b>{carriers}</b>/{languages.length}
                    </small>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
});
