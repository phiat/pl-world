// Inject dist/world.json into the static UI prototype (design reference for the Fresh app).
//   deno task build:db && deno run -A design/prototype/build.ts   → design/prototype/pl-world.html
const here = new URL("./", import.meta.url);
const world = await Deno.readTextFile(new URL("../../dist/world.json", here));
const tpl = await Deno.readTextFile(new URL("template.html", here));
await Deno.writeTextFile(
  new URL("pl-world.html", here),
  tpl.replace("__WORLD__", () => world.replaceAll("</", "<\\/")),
);
console.log("design/prototype/pl-world.html");
