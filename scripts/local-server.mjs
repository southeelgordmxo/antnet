import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve, relative, isAbsolute, extname, join } from "node:path";
import worker, { tick } from "../worker/index.js";
import { browserRead, closeBrowser } from "../services/browser-engine.mjs";
try {
  process.loadEnvFile(".env");
} catch {}
mkdirSync(".local", { recursive: true });
const sql = new DatabaseSync(".local/antnet.sqlite");
sql.exec("PRAGMA journal_mode=WAL");
sql.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)");
for (const name of readdirSync("drizzle")
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  if (!sql.prepare("SELECT name FROM _migrations WHERE name=?").get(name)) {
    sql.exec(readFileSync(join("drizzle", name), "utf8"));
    sql.prepare("INSERT INTO _migrations(name) VALUES (?)").run(name);
  }
}
const DB = {
  prepare(query) {
    let values = [];
    return {
      bind(...args) {
        values = args;
        return this;
      },
      async first() {
        return sql.prepare(query).get(...values) || null;
      },
      async all() {
        return { results: sql.prepare(query).all(...values) };
      },
      async run() {
        const result = sql.prepare(query).run(...values);
        return { meta: { changes: Number(result.changes) } };
      },
    };
  },
};
const root = resolve("out");
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".json": "application/json",
};
const ASSETS = {
  async fetch(req) {
    const u = new URL(req.url);
    let path = resolve(root, "." + decodeURIComponent(u.pathname));
    const withinRoot = relative(root, path);
    if (withinRoot.startsWith("..") || isAbsolute(withinRoot))
      return new Response("Forbidden", { status: 403 });
    if (existsSync(path) && statSync(path).isDirectory())
      path = join(path, "index.html");
    if (!existsSync(path)) return new Response("Not found", { status: 404 });
    return new Response(readFileSync(path), {
      headers: {
        "Content-Type": types[extname(path)] || "application/octet-stream",
      },
    });
  },
};
mkdirSync(".local/frames", { recursive: true });
const env = { ...process.env, DB, ASSETS };
if (process.env.BROWSER_ENABLED === "true")
  env.READ_BROWSER = (url) =>
    browserRead(
      url,
      (
        process.env.CRAWL_ALLOWED_HOSTS ||
        "ethereum.org,solana.com,bitcoin.org,developers.uniswap.org,docs.chain.link,aave.com"
      ).split(","),
    );
env.SAVE_FRAME = async (ant, bytes) =>
  writeFileSync(".local/frames/" + ant + ".jpg", bytes);
env.FRAMES = async (ant) => {
  if (!/^[a-z0-9-]{36}$/.test(ant))
    return new Response("Not found", { status: 404 });
  const file = ".local/frames/" + ant + ".jpg";
  return existsSync(file)
    ? new Response(readFileSync(file), {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
      })
    : new Response("No frame yet", { status: 404 });
};
if (process.env.CONTINUOUS_CRAWL === "true") {
  const run = async () => {
    try {
      await tick(env);
    } catch (e) {
      console.error("Scout:", e.message);
    }
    setTimeout(run, 6000);
  };
  void run();
}
const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1000000) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    const port = Number(process.env.PORT || 3000);
    const allowedHosts = [
      `localhost:${port}`,
      `127.0.0.1:${port}`,
      `[::1]:${port}`,
    ];
    const host = req.headers.host || `localhost:${port}`;
    if (!allowedHosts.includes(host) && !process.env.PUBLIC_ORIGIN) {
      res.writeHead(400).end("Unexpected host");
      return;
    }
    const origin = process.env.PUBLIC_ORIGIN || `http://${host}`;
    const request = new Request(new URL(req.url, origin), {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : Buffer.concat(chunks),
      duplex: "half",
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500).end("Local server error");
  }
});
server.listen(
  Number(process.env.PORT || 3000),
  process.env.LISTEN_HOST || "localhost",
  () => console.log(`Local: http://localhost:${process.env.PORT || 3000}`),
);
process.on("SIGINT", async () => {
  await closeBrowser();
  server.close();
  process.exit(0);
});
