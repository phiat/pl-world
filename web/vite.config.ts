import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [fresh()],
  // The app reads ../dist/world.json and type-imports ../data/*; local-only, so bind to loopback.
  server: { host: "127.0.0.1", port: 8000, fs: { allow: [".."] } },
});
