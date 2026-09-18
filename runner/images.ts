// Build or pull the sandbox image for each language.
//   deno task images                 # everything missing
//   deno task images zig ada         # just these
//   deno task images --rebuild clu   # rebuild even if present (plw-* images only)
//   deno task images --dry-run
import { parseArgs } from "@std/cli/parse-args";
import { loadWorld } from "../data/world.ts";
import { localImages, withTag } from "./sandbox.ts";

const args = parseArgs(Deno.args, { boolean: ["rebuild", "dry-run"] });
const root = new URL("../", import.meta.url).pathname;
const { languages } = await loadWorld();
const ids = args._.map(String);
const have = await localImages();

const sh = async (cmd: string, argv: string[], cwd = root) => {
  console.log(`  $ ${cmd} ${argv.join(" ")}`);
  if (args["dry-run"]) return true;
  const { success } = await new Deno.Command(cmd, { args: argv, cwd, stdout: "inherit", stderr: "inherit" }).output();
  return success;
};

const failed: string[] = [];
for (const l of languages) {
  if (ids.length && !ids.includes(l.id)) continue;
  const t = l.runtime.toolchains.find((t) => t.docker_image);
  if (!t?.docker_image) {
    console.log(`- ${l.id}: no container toolchain`);
    continue;
  }
  const present = have.has(withTag(t.docker_image));
  if (t.dockerfile) {
    if (present && !args.rebuild) {
      console.log(`✓ ${l.id}: ${t.docker_image}`);
      continue;
    }
    console.log(`▶ ${l.id}: building ${t.docker_image} from ${t.dockerfile}`);
    const dir = t.dockerfile.replace(/\/Dockerfile$/, "");
    const fetch = `${root}${dir}/fetch.sh`;
    const hasFetch = await Deno.stat(fetch).then(() => true, () => false);
    const ok = (!hasFetch || await sh("sh", [fetch])) && await sh("docker", ["build", "-t", t.docker_image, dir]);
    if (!ok) failed.push(l.id);
  } else {
    if (present) {
      console.log(`✓ ${l.id}: ${t.docker_image}`);
      continue;
    }
    console.log(`▶ ${l.id}: pulling ${t.docker_image}`);
    if (!await sh("docker", ["pull", t.docker_image])) failed.push(l.id);
  }
}
if (failed.length) {
  console.error(`\nFailed: ${failed.join(", ")}`);
  Deno.exit(1);
}
