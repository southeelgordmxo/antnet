import { build } from "esbuild";
import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
await mkdir("out", { recursive: true });
await cp("public", "out", { recursive: true });
await build({
  entryPoints: ["src/portable.tsx"],
  outfile: "out/app.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
});
await writeFile(
  "out/app.css",
  (await readFile("src/app/globals.css", "utf8")).replace(
    '@import "tailwindcss";',
    "",
  ) +
    "\n" +
    (await readFile("src/app/research.css", "utf8")) +
    "\n" +
    (await readFile("src/components/sites/antnet/live-foraging.css", "utf8")) +
    "\n" +
    (await readFile("src/components/sites/antnet/colony-harvest.css", "utf8")) +
    "\n" +
    (await readFile(
      "src/components/sites/antnet/live-observatory.css",
      "utf8",
    )) +
    "\n" +
    (await readFile("src/components/sites/antnet/research-proof.css", "utf8")),
);
const html =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Ants explore the crypto web. Claude connects the dots. An independent research colony."><title>antnet — collective intelligence</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>';
for (const route of [
  "",
  "crawlers",
  "queen",
  "treasury",
  "mint",
  "order",
  "man",
  "library",
]) {
  await mkdir(`out/${route}`, { recursive: true });
  await writeFile(`out/${route ? route + "/" : ""}index.html`, html);
}
console.log(
  "Built portable React frontend from the Next.js template components.",
);
