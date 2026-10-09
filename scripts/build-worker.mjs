import { build } from "esbuild";
import { mkdir, cp } from "node:fs/promises";
await mkdir("dist/server", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await build({
  entryPoints: ["worker/index.js"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
});
console.log("AntNet Worker and frontend built.");
