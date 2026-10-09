const seeds = [
  "https://ethereum.org/en/developers/docs/",
  "https://solana.com/docs",
  "https://bitcoin.org/en/",
  "https://developers.uniswap.org/docs/get-started/concepts/how-uniswap-works",
  "https://docs.chain.link/",
  "https://aave.com/docs",
];
export const autopilotLimits = { intervalMinutes: 30, dailyRuns: 12 };
export async function autopilotState(env) {
  return env.DB.prepare("SELECT * FROM colony_settings WHERE id=1")
    .bind()
    .first();
}

export async function seedAutopilot(env, { immediate = false } = {}) {
  const pending = await env.DB.prepare(
    "SELECT count(*) AS n FROM orders WHERE status IN ('queued','reading')",
  )
    .bind()
    .first();
  if (pending.n) return null;
  const ant = await env.DB.prepare(
    "SELECT id FROM ants WHERE paused=0 ORDER BY created LIMIT 1",
  )
    .bind()
    .first();
  if (!ant) return null;
  const date = new Date();
  const day = date.toISOString().slice(0, 10);
  const expectedCursor = (await autopilotState(env))?.cursor;
  const claimed = await env.DB.prepare(
    `UPDATE colony_settings SET next_run=?,daily_date=?,daily_runs=CASE WHEN daily_date=? THEN daily_runs+1 ELSE 1 END,cursor=cursor+1 WHERE id=1 AND enabled=1 AND cursor=? AND ${immediate ? "1=1" : "next_run<=?"} AND (daily_date<>? OR daily_runs<?) AND NOT EXISTS (SELECT 1 FROM orders WHERE status IN ('queued','reading')) RETURNING *`,
  )
    .bind(
      new Date(+date + autopilotLimits.intervalMinutes * 60000).toISOString(),
      day,
      day,
      expectedCursor,
      ...(immediate ? [] : [date.toISOString()]),
      day,
      autopilotLimits.dailyRuns,
    )
    .first();
  if (!claimed) return null;
  const approved = (
    env.CRAWL_ALLOWED_HOSTS || seeds.map((s) => new URL(s).hostname).join(",")
  )
    .split(",")
    .map((h) => h.trim());
  const available = seeds.filter((s) => approved.includes(new URL(s).hostname));
  if (!available.length) return null;
  const root = available[(claimed.cursor - 1) % available.length];
  // Prefer a previously discovered document as the next starting point so the
  // scout expands trails instead of repeatedly starting at the same homepage.
  const candidates = (
    await env.DB.prepare(
      "SELECT url FROM documents WHERE url LIKE ? ORDER BY created DESC LIMIT 20",
    )
      .bind(new URL(root).origin + "/%")
      .all()
  ).results.filter((doc) => !/\.pdf(?:\?|$)/i.test(doc.url));
  const url =
    candidates.length && claimed.cursor > available.length
      ? candidates[
          Math.floor((claimed.cursor - 1) / available.length) %
            candidates.length
        ].url
      : root;
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO orders(id,url,ant_id,status,pages,message,target,queue,visited,created,max_reads,automatic) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
  )
    .bind(
      id,
      url,
      ant.id,
      "queued",
      0,
      "Autopilot expedition queued",
      3,
      JSON.stringify([url]),
      "[]",
      date.toISOString(),
      6,
      1,
    )
    .run();
  return id;
}
