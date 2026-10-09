import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import worker from "../worker/index.js";
import { postgresAdapter } from "../services/postgres-adapter.mjs";
import { pdfFixture } from "./fixtures/pdf.mjs";
import { seedAutopilot, autopilotLimits } from "../worker/autopilot.js";
const sqlite = process.env.TEST_POSTGRES ? null : new DatabaseSync(":memory:");
if (sqlite)
  for (const file of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync("drizzle/" + file, "utf8"));
let DB = {
  prepare(q) {
    let args = [];
    return {
      bind(...v) {
        args = v;
        return this;
      },
      async first() {
        return sqlite.prepare(q).get(...args) || null;
      },
      async all() {
        return { results: sqlite.prepare(q).all(...args) };
      },
      async run() {
        return {
          meta: { changes: Number(sqlite.prepare(q).run(...args).changes) },
        };
      },
    };
  },
};
let pg;
if (process.env.TEST_POSTGRES) {
  const { PGlite } = await import("@electric-sql/pglite");
  pg = new PGlite();
  for (const file of readdirSync("netlify/database/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pg.exec(readFileSync("netlify/database/migrations/" + file, "utf8"));
  DB = postgresAdapter({
    query: async (q, args) => {
      const result = await pg.query(q, args);
      return { rows: result.rows, rowCount: result.affectedRows };
    },
  });
}
const env = {
  DB,
  ASSETS: { fetch: () => new Response("asset") },
  CRAWL_ALLOWED_HOSTS: "ethereum.org",
};
const call = async (path, body, headers = {}) => {
  const r = await worker.fetch(
    new Request("https://antnet.test/api/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://antnet.test",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
  );
  return { status: r.status, data: await r.json() };
};
const realFetch = globalThis.fetch;
let claudeCalls = 0;
let claudeNeedsCredits = false;
let sourceVersion = 1;
let sourceRequests = 0;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url === "https://api.anthropic.com/v1/messages") {
    claudeCalls++;
    const body = JSON.parse(init.body);
    assert.match(body.system, /untrusted/);
    assert.match(body.messages[0].content, /Ethereum/);
    if (claudeNeedsCredits)
      return Response.json(
        {
          error: {
            message:
              "Your credit balance is too low to access the Anthropic API.",
          },
        },
        { status: 400 },
      );
    return Response.json({
      content: [
        { type: "text", text: "Ethereum uses a decentralized protocol [1]." },
      ],
    });
  }
  sourceRequests++;
  if (url.endsWith("/paper.pdf"))
    return new Response(
      pdfFixture(
        "Ethereum validators secure a decentralized blockchain. Smart contracts execute transactions. The protocol uses consensus to maintain its shared state.",
      ),
      {
        headers: { "Content-Type": "application/pdf" },
      },
    );
  if (url.endsWith("/excluded.pdf"))
    return new Response("not-for-indexing", {
      headers: { "Content-Type": "application/pdf", "X-Robots-Tag": "noai" },
    });
  if (url.endsWith("/oversized.pdf"))
    return new Response(new Uint8Array(8000001), {
      headers: { "Content-Type": "application/pdf" },
    });
  if (url.endsWith("robots.txt"))
    return new Response("User-agent: *\nDisallow: /private\n", {
      headers: { "Content-Type": "text/plain" },
    });
  if (url.includes("/redirect"))
    return new Response(null, {
      status: 302,
      headers: { Location: "https://127.0.0.1/private" },
    });
  return new Response(
    `<html><title>Ethereum protocol</title><body><div class="header">UNRELATED_NAVIGATION</div><div id="content"><h1>Ethereum</h1><p>Ethereum is a decentralized blockchain protocol. Validators verify transactions and smart contracts run on the network. This source describes consensus and the crypto ecosystem. Revision ${sourceVersion}.</p><a href="/page-two">More</a></div></body></html>`,
    { headers: { "Content-Type": "text/html" } },
  );
};
try {
  assert.equal((await call("ants", { name: "<script>" })).status, 400);
  const ant = (await call("ants", { name: "test_scout" })).data;
  assert.equal(
    (await call("crawl", { url: "https://127.0.0.1/", antId: ant.id })).status,
    400,
  );
  assert.equal(
    (
      await call(
        "ants",
        { name: "cross_origin" },
        { Origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  await call("ant/update", { id: ant.id, paused: true });
  assert.equal(
    (await call("crawl", { url: "https://ethereum.org/page", antId: ant.id }))
      .status,
    409,
  );
  await call("ant/update", { id: ant.id, paused: false });
  const first = (
    await call("crawl", {
      url: "https://ethereum.org/page",
      antId: ant.id,
      limit: 2,
    })
  ).data;
  assert.equal(first.status, "queued");
  assert.equal((await call("tick", {})).data.pages, 1);
  await call("tick", {});
  let state = (await call("state")).data;
  assert.equal(state.stats.pages, 1);
  assert.ok(!state.documents[0].excerpt.includes("UNRELATED_NAVIGATION"));
  assert.ok(state.events.some((e) => e.kind === "duplicate"));
  assert.equal(state.orders[0].status, "complete");
  const blocked = (
    await call("crawl", { url: "https://ethereum.org/private", antId: ant.id })
  ).data;
  await call("tick", {});
  state = (await call("state")).data;
  assert.equal(state.orders.find((o) => o.id === blocked.id).status, "failed");
  const redirect = (
    await call("crawl", { url: "https://ethereum.org/redirect", antId: ant.id })
  ).data;
  await call("tick", {});
  state = (await call("state")).data;
  assert.equal(state.orders.find((o) => o.id === redirect.id).status, "failed");
  const cancelled = (
    await call("crawl", { url: "https://ethereum.org/cancel", antId: ant.id })
  ).data;
  await call("order/cancel", { id: cancelled.id });
  assert.equal((await call("tick", {})).data.idle, true);
  assert.equal(
    (await call("ask", { question: "What is Ethereum?" })).status,
    503,
  );
  env.ANTHROPIC_API_KEY = "fake-test-key-not-a-credential";
  const answer = await call("ask", { question: "What is Ethereum?" });
  assert.equal(answer.status, 200);
  assert.equal(answer.data.sources[0].url, "https://ethereum.org/page");
  assert.equal(claudeCalls, 1);
  assert.ok(
    (await call("document?id=" + state.documents[0].id)).data.content.includes(
      "Ethereum",
    ),
  );
  assert.equal(
    (await call("library?q=Ethereum&host=ethereum.org&sort=tokens")).data.total,
    1,
  );
  assert.equal((await call("library?q=%25")).data.total, 0);
  assert.equal((await call("library?offset=30")).data.documents.length, 0);
  const originalDocument = (await call("document?id=" + state.documents[0].id))
    .data;
  const refreshAnt = (await call("ants", { name: "refresh_scout" })).data;
  sourceVersion = 2;
  const refreshOrder = (
    await call("crawl", {
      url: "https://ethereum.org/page",
      antId: refreshAnt.id,
      limit: 1,
    })
  ).data;
  await call("tick", {});
  await call("tick", {});
  const refreshedDocument = (await call("document?id=" + originalDocument.id))
    .data;
  assert.match(refreshedDocument.content, /Revision 2/);
  assert.equal(refreshedDocument.ant_id, originalDocument.ant_id);
  assert.equal(refreshedDocument.created, originalDocument.created);
  state = (await call("state")).data;
  assert.equal(
    state.stats.pages,
    1,
    "Refreshing does not inflate new-page totals",
  );
  assert.ok(
    state.events.some(
      (e) => e.order_id === refreshOrder.id && e.kind === "refreshed",
    ),
  );
  assert.equal(
    claudeCalls,
    2,
    "Refreshed sources reach Claude even when collected by another ant",
  );
  const expiredOrder = (
    await call("crawl", {
      url: "https://ethereum.org/expired",
      antId: ant.id,
    })
  ).data;
  await DB.prepare("UPDATE orders SET created=? WHERE id=?")
    .bind(new Date(Date.now() - 4 * 3600000).toISOString(), expiredOrder.id)
    .run();
  const beforeExpiry = sourceRequests;
  const expiredResult = (await call("tick", {})).data;
  assert.equal(expiredResult.status, "failed");
  assert.match(expiredResult.message, /deadline/);
  assert.equal(
    sourceRequests,
    beforeExpiry,
    "Expired jobs must not fetch a page or robots.txt",
  );
  assert.equal((await call("tick", {})).data.idle, true);
  const pdfOrder = (
    await call("crawl", {
      url: "https://ethereum.org/paper.pdf",
      antId: ant.id,
    })
  ).data;
  const pdfResult = (await call("tick", {})).data;
  assert.equal(pdfResult.id, pdfOrder.id);
  assert.equal(pdfResult.pages, 1, JSON.stringify(pdfResult));
  const pdfSearch = (await call("library?q=Ethereum&host=ethereum.org")).data;
  assert.ok(pdfSearch.documents.some((d) => d.url.endsWith("/paper.pdf")));
  for (const path of ["excluded", "oversized"]) {
    await call("crawl", {
      url: `https://ethereum.org/${path}.pdf`,
      antId: ant.id,
    });
    assert.equal((await call("tick", {})).data.status, "failed");
  }
  claudeNeedsCredits = true;
  const billingFailure = await call("ask", { question: "What is Ethereum?" });
  assert.match(billingFailure.data.error, /needs API credits/);
  assert.equal((await call("state")).data.config.claudeStatus, "needs_credits");
  assert.ok(
    (await call("library")).data.total > 0,
    "Billing failures retain the corpus",
  );
  claudeNeedsCredits = false;
  assert.equal(
    (await call("ask", { question: "What is Ethereum?" })).status,
    200,
  );
  assert.equal((await call("state")).data.config.claudeStatus, "ready");
  assert.equal(await seedAutopilot(env), null, "Autopilot starts disabled");
  assert.equal((await call("autopilot", { enabled: "yes" })).status, 400);
  await call("autopilot", { enabled: true });
  const claims = await Promise.all([seedAutopilot(env), seedAutopilot(env)]);
  assert.equal(
    claims.filter(Boolean).length,
    1,
    "Concurrent dispatchers seed only one expedition",
  );
  const automatic = await DB.prepare("SELECT * FROM orders WHERE id=?")
    .bind(claims.find(Boolean))
    .first();
  assert.equal(automatic.target, 3);
  assert.equal(automatic.max_reads, 6);
  assert.equal(automatic.automatic, 1);
  assert.equal(
    (await call("forage", {})).status,
    409,
    "Forage now must not duplicate pending work",
  );
  await DB.prepare("UPDATE orders SET status='complete' WHERE id=?")
    .bind(automatic.id)
    .run();
  assert.equal(
    await seedAutopilot(env),
    null,
    "Scheduled dispatch respects next run",
  );
  const manualClaims = await Promise.all([
    call("forage", {}),
    call("forage", {}),
  ]);
  assert.equal(
    manualClaims.filter((r) => r.status === 201).length,
    1,
    "Concurrent Forage now requests start one expedition",
  );
  await call("autopilot", { enabled: false });
  assert.equal(
    (
      await DB.prepare("SELECT status FROM orders WHERE id=?")
        .bind(manualClaims.find((r) => r.status === 201).data.id)
        .first()
    ).status,
    "cancelled",
  );
  await call("autopilot", { enabled: true });
  await DB.prepare(
    "UPDATE colony_settings SET next_run=?,daily_runs=?,daily_date=? WHERE id=1",
  )
    .bind("", autopilotLimits.dailyRuns, new Date().toISOString().slice(0, 10))
    .run();
  assert.equal(
    await seedAutopilot(env),
    null,
    "Daily autopilot limit is enforced",
  );
  assert.equal(
    (await call("forage", {})).status,
    409,
    "Forage now cannot bypass daily cap",
  );
  await DB.prepare("UPDATE colony_settings SET daily_date=? WHERE id=1")
    .bind("2020-01-01")
    .run();
  assert.ok(
    await seedAutopilot(env),
    "Autopilot budget resets on a new UTC day",
  );
  await call("autopilot", { enabled: false });
  const harvest = await call("harvest");
  assert.equal(harvest.status, 200);
  assert.ok(
    harvest.data.progress.newSources > 0,
    "Harvest reads the saved corpus",
  );
  assert.equal(harvest.data.policy.creatorRewardShare, 0.5);
  assert.equal(harvest.data.execution.status, "inactive");
  assert.equal(harvest.data.execution.fundedAmount, null);
  console.log(
    "PASS: identity validation, cross-origin guard, SSRF URL+redirect guard, queue processing, content deduplication, source refresh and attribution, expiry before network access, robots exclusion, pause/resume, cancellation, missing-key state, Claude request/citations, source readback.",
  );
} finally {
  globalThis.fetch = realFetch;
  sqlite?.close();
  await pg?.close();
}
