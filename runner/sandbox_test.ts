import { assertEquals, assertMatch, assertThrows } from "@std/assert";
import { loadWorld } from "../data/world.ts";
import { isFixedFormFortran, localImages, normalizeOutput, Sandbox, UnknownLanguageError, withTag } from "./sandbox.ts";

const world = await loadWorld();
const sandbox = new Sandbox(world.languages);
const snippet = (lang: string, task: string) => world.languages.find((l) => l.id === lang)!.snippets[task].code;

Deno.test("plan substitutes {file}/{out} and wraps compile output onto stderr", () => {
  const p = sandbox.plan("c", "int main(void){return 0;}");
  assertEquals(p.image, "gcc:14");
  assertEquals(p.filename, "main.c");
  assertEquals(p.command, "gcc -std=c99 -O2 -o prog main.c && prog");
  assertMatch(p.script, /\{ gcc -std=c99 -O2 -o prog main\.c\n\} >&2/);
});

Deno.test("source file naming follows each compiler's rules", () => {
  assertEquals(sandbox.plan("ada", snippet("ada", "higher-order")).filename, "map_filter.adb");
  assertEquals(sandbox.plan("modula2", snippet("modula2", "fizzbuzz")).filename, "FizzBuzz.mod");
  assertEquals(sandbox.plan("java", snippet("java", "hello")).filename, "Main.java");
  assertEquals(sandbox.plan("fsharp", snippet("fsharp", "hello")).filename, "main.fsx");
  assertEquals(sandbox.plan("fortran", snippet("fortran", "signature")).filename, "main.f");
  assertEquals(sandbox.plan("fortran", snippet("fortran", "hello")).filename, "main.f");
  assertEquals(sandbox.plan("fortran", snippet("fortran", "factorial")).filename, "main.f90");
});

Deno.test("fixed-form Fortran detection", () => {
  assertEquals(isFixedFormFortran("C     COMMENT\n      PRINT *, 'HI'\n      END\n"), true);
  assertEquals(isFixedFormFortran("  100 FORMAT(I5)\n      END"), true);
  assertEquals(isFixedFormFortran("program main\n  print *, 'hi'\nend program\n"), false);
});

Deno.test("unknown languages are rejected", () => {
  assertThrows(() => sandbox.plan("cobra", ""), UnknownLanguageError);
});

Deno.test("container is locked down", () => {
  const args = sandbox.dockerArgs(sandbox.plan("c", ""), "t");
  for (const flag of ["--network", "--cap-drop", "--pids-limit", "--memory", "--pull"]) {
    assertEquals(args.includes(flag), true, flag);
  }
  assertEquals(args[args.indexOf("--network") + 1], "none");
});

Deno.test("normalizeOutput ignores trailing whitespace and CRLF", () => {
  assertEquals(normalizeOutput("a \r\nb\t\n\n"), "a\nb");
});

const hasGcc = (await localImages()).has(withTag("gcc:14"));
Deno.test({ name: "runs C end to end and reports phases", ignore: !hasGcc }, async () => {
  const events: string[] = [];
  const r = await sandbox.run({ lang: "c", code: snippet("c", "hello") }, (e) => events.push(e.type));
  assertEquals(r.exit_code, 0);
  assertEquals(r.stdout, "Hello, World!\n");
  assertEquals(r.failed_phase, null);
  assertEquals(events.filter((e) => e === "phase").length, 2);
  assertEquals(events.at(-1), "exit");
});

Deno.test({ name: "compile errors are attributed to the compile phase", ignore: !hasGcc }, async () => {
  const r = await sandbox.run({ lang: "c", code: "int main(void) { return x; }" });
  assertEquals(r.failed_phase, "compile");
  assertMatch(r.stderr, /undeclared/);
});

Deno.test({ name: "timeouts kill the container", ignore: !hasGcc }, async () => {
  const quick = new Sandbox(world.languages, { timeoutMs: 3000 });
  const r = await quick.run({ lang: "c", code: "int main(void){ for(;;); }" });
  assertEquals(r.timed_out, true);
  assertEquals(r.exit_code, null);
});
