// Load and validate the whole data set, and reconcile lineage into one edge list.
// Shared by scripts/build-db.ts, the Fresh app (web/) and the sandbox runner (runner/).
import { Concept, Language, LANGUAGE_IDS, Task } from "./schema.ts";
import conceptsJson from "./concepts.json" with { type: "json" };
import tasksJson from "./tasks.json" with { type: "json" };

export type Edge = {
  parent: string;
  child: string;
  kind: string;
  weight: string;
  note: string | null;
  declared_by: "child" | "parent" | "both";
  /** Parent is younger than child: a later language fed ideas back into a newer version (Kotlin → PHP 8). */
  retro: boolean;
};

export type World = {
  languages: Language[];
  edges: Edge[];
  concepts: Concept[];
  tasks: Task[];
};

const dataDir = new URL("./", import.meta.url);

/** Reads data/languages/*.json. Missing files are skipped (reported via onSkip); invalid ones throw. */
export async function loadWorld(opts: { onSkip?: (id: string) => void } = {}): Promise<World> {
  const concepts = Concept.array().parse(conceptsJson);
  const tasks = Task.array().parse(tasksJson);
  const languages: Language[] = [];
  for (const id of LANGUAGE_IDS) {
    let raw: string;
    try {
      raw = await Deno.readTextFile(new URL(`languages/${id}.json`, dataDir));
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) throw e;
      opts.onSkip?.(id);
      continue;
    }
    languages.push(Language.parse(JSON.parse(raw)));
  }
  return { languages, edges: reconcileEdges(languages), concepts, tasks };
}

/** Child-declared edges carry kind/weight; parent-only claims become minor influences. */
export function reconcileEdges(languages: Language[]): Edge[] {
  const year = new Map(languages.map((l) => [l.id as string, l.year]));
  const edges = new Map<string, Edge>();
  for (const l of languages) {
    for (const p of l.influenced_by) {
      if (!year.has(p.id)) continue;
      edges.set(`${p.id}>${l.id}`, {
        parent: p.id,
        child: l.id,
        kind: p.kind,
        weight: p.weight,
        note: p.note ?? null,
        declared_by: "child",
        retro: year.get(p.id)! > l.year,
      });
    }
  }
  for (const l of languages) {
    for (const c of l.influenced) {
      if (!year.has(c)) continue;
      const e = edges.get(`${l.id}>${c}`);
      if (e) e.declared_by = "both";
      else {
        edges.set(`${l.id}>${c}`, {
          parent: l.id,
          child: c,
          kind: "influence",
          weight: "minor",
          note: null,
          declared_by: "parent",
          retro: l.year > year.get(c)!,
        });
      }
    }
  }
  return [...edges.values()];
}
