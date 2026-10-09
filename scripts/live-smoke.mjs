import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import worker from "../worker/index.js";
mkdirSync(".local", { recursive: true });
const sql = new DatabaseSync(".local/live-check.sqlite");
sql.exec("CREATE TABLE IF NOT EXISTS _migrations(name TEXT PRIMARY KEY)");
for (const f of readdirSync("drizzle")
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  if (!sql.prepare("SELECT name FROM _migrations WHERE name=?").get(f)) {
    sql.exec(readFileSync("drizzle/" + f, "utf8"));
    sql.prepare("INSERT INTO _migrations(name)VALUES(?)").run(f);
  }
}
const DB = {
  prepare(q) {
    let a = [];
    return {
      bind(...v) {
        a = v;
        return this;
      },
      async first() {
        return sql.prepare(q).get(...a) || null;
      },
      async all() {
        return { results: sql.prepare(q).all(...a) };
      },
      async run() {
        return { meta: { changes: Number(sql.prepare(q).run(...a).changes) } };
      },
    };
  },
};
const env = { DB, ASSETS: { fetch: () => new Response("asset") } };
async function call(path, body) {
  const r = await worker.fetch(
    new Request("https://antnet.test/api/" + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
  );
  return { status: r.status, data: await r.json() };
}
const ant = (await call("ants", { name: "live_test_scout" })).data;
console.log(
  await call("crawl", {
    url: "https://bitcoin.org/en/bitcoin-paper",
    antId: ant.id,
    limit: 1,
  }),
);
console.log(await call("tick", {}));
const state = (await call("state")).data;
console.log({
  pages: state.stats.pages,
  titles: state.documents.map((d) => d.title),
  events: state.events.map((e) => ({ kind: e.kind, message: e.message })),
});
sql.close();
