// GET /api/tasks — the programs every language is asked to write, and what each one is meant to show.
import { define } from "../../utils.ts";
import { json } from "../../lib/api.ts";
import { tasks } from "../../lib/world.ts";

export const handler = define.handlers({
  GET() {
    return json({ count: tasks.length, tasks });
  },
});
