// host.cjs -- run a compiled Elm program in Node.js and print what it sends out through its ports.
//
//   node host.cjs COMPILED.js MODULE
//
// Elm has no console: a program talks to the outside world only through ports. Sandbox programs are
// Platform.worker programs that send their output through an outgoing port such as
//
//   port print : String -> Cmd msg
//
// Every outgoing port is subscribed; a String is printed as is, anything else as JSON, one value per line.
// The program is started without flags, so main should be a Program () model msg. Node.js exits once the
// program has nothing left to do (no subscriptions and no pending tasks).
"use strict";

const [file, moduleName = "Main"] = process.argv.slice(2);
if (!file) {
  console.error("usage: node host.cjs COMPILED.js [MODULE]");
  process.exit(2);
}

// A development build announces "Compiled in DEV mode..." with console.warn when it loads. Sandbox builds
// are always development builds (elm make --optimize rejects the Debug module), so the notice is dropped.
const warn = console.warn;
console.warn = (...args) => {
  if (!(typeof args[0] === "string" && args[0].startsWith("Compiled in DEV mode"))) warn(...args);
};
const { Elm } = require(require("node:path").resolve(file));
console.warn = warn;

const program = moduleName.split(".").reduce((scope, name) => scope?.[name], Elm);
if (!program?.init) {
  console.error(`host.cjs: ${file} has no Elm program named ${moduleName}`);
  process.exit(2);
}

const app = program.init();
for (const port of Object.values(app.ports ?? {})) {
  if (typeof port.subscribe === "function") {
    port.subscribe((value) => {
      process.stdout.write((typeof value === "string" ? value : JSON.stringify(value)) + "\n");
    });
  }
}
