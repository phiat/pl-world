import { famColor } from "../lib/meta.ts";

export function LangChip({ id, name, family, extra }: { id: string; name: string; family: string; extra?: string }) {
  return (
    <a class="chip" href={`/lang/${id}`}>
      <i style={`background:${famColor(family)}`} />
      {name}
      {extra && <small>{extra}</small>}
    </a>
  );
}
