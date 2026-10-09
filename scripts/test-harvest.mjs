import assert from "node:assert/strict";
import { summarizeHarvest } from "../worker/harvest.js";
const day = "2026-10-08T12:00:00.000Z";
const docs = Array.from({ length: 10 }, (_, i) => ({
  url: `https://source${i % 3}.example/article-${i}`,
  created: day,
}));
const report = {
  id: "report",
  question: "Research",
  answer: "Findings [1], [2], [3].",
  sources: docs.slice(0, 3).map((d, i) => ({ number: i + 1, url: d.url })),
  created: day,
};
const summarize = (d = docs, a = [report], date = new Date(day)) =>
  summarizeHarvest(d, a, date);
assert.equal(summarize().researchReady, true);
assert.equal(
  summarize().execution.status,
  "inactive",
  "Research never authorizes a transaction",
);
assert.equal(summarize().execution.fundedAmount, null);
assert.equal(
  summarize([...docs, docs[0]]).progress.newSources,
  10,
  "Repeated URLs do not inflate work",
);
assert.equal(summarize(docs.slice(0, 9)).researchReady, false);
assert.equal(
  summarize(
    docs.map((d) => ({ ...d, url: d.url.replace(/source\d/, "source0") })),
  ).researchReady,
  false,
);
assert.equal(
  summarize(docs, [{ ...report, answer: "Just [1]." }]).researchReady,
  false,
  "A source list without actual citations does not qualify",
);
assert.equal(
  summarize(docs, [{ ...report, sources: "invalid json" }]).progress
    .citedReports,
  0,
);
assert.equal(
  summarize(docs, [
    {
      ...report,
      sources: [
        report.sources[0],
        { ...report.sources[0], number: 2 },
        { ...report.sources[0], number: 3 },
      ],
    },
  ]).researchReady,
  false,
  "Three citation numbers for one URL do not qualify",
);
assert.equal(
  summarize(docs.map((d) => ({ ...d, created: "2026-10-07T23:59:59.999Z" })))
    .progress.newSources,
  0,
);
assert.equal(
  summarize(docs, [{ ...report, created: "2026-10-09T00:00:00.000Z" }]).progress
    .citedReports,
  0,
);
assert.equal(
  summarize(docs, [report], new Date("2026-10-09T00:00:00.000Z")).researchReady,
  false,
  "UTC day boundaries reset research progress",
);
assert.equal(
  summarize(
    docs.map((d) => ({ ...d, url: d.url.replace("https:", "javascript:") })),
  ).progress.newSources,
  0,
);
console.log(
  "PASS: harvest daily boundaries, unique sources/domains, real citation evidence, and permanently inactive financial execution.",
);
