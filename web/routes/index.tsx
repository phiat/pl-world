import { define } from "../utils.ts";
import River from "../islands/River.tsx";
import { PageHead } from "../components/PageHead.tsx";
import { concepts, languages } from "../lib/world.ts";
import { riverEdges, riverNodes } from "../lib/river.ts";
import type { ConceptLite } from "../lib/meta.ts";

const nodes = riverNodes();

export default define.page(function Home({ url }) {
  const gene = url.searchParams.get("gene") ?? "";
  return (
    <section class="wrap">
      <PageHead
        description={`Seventy years of programming languages: where ${languages.length} languages came from, what they are made of, and the same programs side by side.`}
        url={url}
      />
      <River
        nodes={nodes}
        edges={riverEdges}
        concepts={concepts as ConceptLite[]}
        initialGene={concepts.some((c) => c.id === gene) ? gene : ""}
      />
    </section>
  );
});
