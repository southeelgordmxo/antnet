export const harvestPolicy = Object.freeze({
  name: "Colony Harvest",
  status: "proposal",
  creatorRewardShare: 0.5,
  newSources: 10,
  domains: 3,
  citedReports: 1,
  sourcesPerReport: 3,
  maxBuybacksPerDay: 1,
});

export function summarizeHarvest(documents, answers, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const start = `${day}T00:00:00.000Z`;
  const end = new Date(Date.parse(start) + 86400000).toISOString();
  const sourceUrls = new Set();
  const domains = new Set();
  for (const doc of documents) {
    if (doc.created < start || doc.created >= end) continue;
    try {
      const url = new URL(doc.url);
      if (url.protocol !== "https:") continue;
      url.hash = "";
      sourceUrls.add(url.href);
      domains.add(url.hostname.replace(/^www\./, ""));
    } catch {
      /* Invalid source metadata never advances a milestone. */
    }
  }
  const reports = [];
  for (const answer of answers) {
    if (answer.created < start || answer.created >= end) continue;
    let sources;
    try {
      sources =
        typeof answer.sources === "string"
          ? JSON.parse(answer.sources)
          : answer.sources;
    } catch {
      continue;
    }
    if (!Array.isArray(sources)) continue;
    const cited = new Set(
      [...String(answer.answer || "").matchAll(/\[(\d+)\]/g)].map((match) =>
        Number(match[1]),
      ),
    );
    const used = new Set(
      sources
        .filter(
          (source) => cited.has(source.number) && sourceUrls.has(source.url),
        )
        .map((source) => source.url),
    );
    if (used.size >= harvestPolicy.sourcesPerReport)
      reports.push({
        id: answer.id,
        question: answer.question,
        created: answer.created,
        sourceCount: used.size,
      });
  }
  const researchReady =
    sourceUrls.size >= harvestPolicy.newSources &&
    domains.size >= harvestPolicy.domains &&
    reports.length >= harvestPolicy.citedReports;
  return {
    policy: harvestPolicy,
    epoch: { day, start, end, timezone: "UTC" },
    progress: {
      newSources: sourceUrls.size,
      domains: domains.size,
      citedReports: reports.length,
    },
    researchReady,
    domainNames: [...domains].sort(),
    reports: reports.slice(0, 5),
    execution: {
      status: "inactive",
      fundedAmount: null,
      boughtTokens: null,
      transaction: null,
    },
  };
}

export async function readHarvest(env, date = new Date()) {
  const start = `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
  const end = new Date(Date.parse(start) + 86400000).toISOString();
  const [documents, answers] = await Promise.all([
    env.DB.prepare(
      "SELECT url,created FROM documents WHERE created>=? AND created<?",
    )
      .bind(start, end)
      .all(),
    env.DB.prepare(
      "SELECT id,question,answer,sources,created FROM answers WHERE created>=? AND created<? ORDER BY created DESC",
    )
      .bind(start, end)
      .all(),
  ]);
  return summarizeHarvest(documents.results, answers.results, date);
}
