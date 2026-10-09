"use client";
/* Native links also serve the portable React build. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, Check, Leaf, RefreshCw } from "lucide-react";
import { readApiResponse } from "../../../lib/api-response";
import "./colony-harvest.css";

type Harvest = {
  policy: {
    creatorRewardShare: number;
    newSources: number;
    domains: number;
    citedReports: number;
    sourcesPerReport: number;
    maxBuybacksPerDay: number;
  };
  epoch: { day: string; start: string; end: string; timezone: string };
  progress: { newSources: number; domains: number; citedReports: number };
  researchReady: boolean;
  domainNames: string[];
  reports: {
    id: string;
    question: string;
    sourceCount: number;
    created: string;
  }[];
  execution: { status: "inactive" };
};

export function ColonyHarvest() {
  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [exampleFees, setExampleFees] = useState("100");
  const [exampleReserve, setExampleReserve] = useState("40");
  useEffect(() => {
    let stopped = false;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/harvest", {
          signal: controller.signal,
        });
        const data: Harvest = await readApiResponse(response);
        if (!stopped) {
          setHarvest(data);
          setError("");
        }
      } catch (e) {
        if (!stopped)
          setError(
            e instanceof Error ? e.message : "Harvest progress is unavailable.",
          );
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
    };
  }, [refreshKey]);
  const share = harvest?.policy.creatorRewardShare ?? 0.5;
  const metrics = [
    {
      key: "newSources" as const,
      label: "new sources",
      target: harvest?.policy.newSources ?? 10,
      detail: "Unique pages saved today. Refreshes don’t count twice.",
    },
    {
      key: "domains" as const,
      label: "source domains",
      target: harvest?.policy.domains ?? 3,
      detail: "Research across different sites, beyond a single source.",
    },
    {
      key: "citedReports" as const,
      label: "cited report",
      target: harvest?.policy.citedReports ?? 1,
      detail: "Claude must cite at least three of today’s saved sources.",
    },
  ];
  const fees = Math.max(0, Math.min(Number(exampleFees) || 0, 1e9));
  const reserve = Math.max(0, Math.min(Number(exampleReserve) || 0, 1e9));
  const exampleBudget = Math.min(fees * share, Math.max(0, fees - reserve));
  const amount = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return (
    <section className="colony-harvest" aria-labelledby="harvest-title">
      <header className="harvest-header">
        <div>
          <span className="harvest-eyebrow">
            <Leaf size={14} /> RESEARCH RETURNS TO THE COLONY
          </span>
          <h2 id="harvest-title">
            Colony Harvest<span>.</span>
          </h2>
          <p>
            The ants bring back knowledge. A share of creator rewards could
            bring back $ANT.
          </p>
        </div>
        <span className="harvest-proposal">
          PROPOSED POLICY · EXECUTION INACTIVE
        </span>
      </header>
      <div className="harvest-overview">
        <div className="harvest-allocation">
          <strong>
            {Math.round(share * 100)}
            <small>%</small>
          </strong>
          <span>
            proposed share of received
            <br />
            creator rewards for buybacks
          </span>
          <div
            className="harvest-split"
            aria-label="Proposed allocation: fifty percent harvest reserve and fifty percent remaining resources"
          >
            <i />
          </div>
          <p>
            Operating costs and the required reserve come first. The buyback
            budget can never exceed available funds.
          </p>
        </div>
        <div className="harvest-rules">
          <span className="harvest-eyebrow">ONE DAILY RESEARCH HARVEST</span>
          <h3>Useful work opens the gate.</h3>
          <p>
            Collect 10 new sources across three domains. Publish a Claude report
            that actually cites at least three of those sources. Then a capped
            buyback could become eligible.
          </p>
          <ol>
            <li>
              <span>01</span> Verify received creator rewards
            </li>
            <li>
              <span>02</span> Protect the operating reserve
            </li>
            <li>
              <span>03</span> Check the day’s research evidence
            </li>
            <li>
              <span>04</span> Publish the buyback receipt and reserve balance
            </li>
          </ol>
          <p className="harvest-fine">
            At most one buyback per UTC day. Research progress alone never moves
            funds.
          </p>
        </div>
      </div>
      <div className="harvest-progress-heading">
        <div>
          <span className="harvest-eyebrow">
            LIVE RESEARCH / PROPOSED THRESHOLDS
          </span>
          <h3>
            {harvest?.epoch.day ?? "Loading today’s harvest…"}
            {harvest && <small> UTC</small>}
          </h3>
        </div>
        <button
          aria-label="Refresh harvest progress"
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <div className="harvest-metrics">
        {metrics.map((metric) => {
          const value = harvest?.progress[metric.key];
          const complete = value != null && value >= metric.target;
          return (
            <div
              key={metric.key}
              className={
                complete ? "harvest-metric is-complete" : "harvest-metric"
              }
            >
              <div>
                <strong>
                  {value ?? "—"}
                  <small> / {metric.target}</small>
                </strong>
                {complete && (
                  <Check size={18} aria-label="Research threshold met" />
                )}
              </div>
              <h4>{metric.label}</h4>
              <progress
                aria-label={`${metric.label} progress`}
                max={metric.target}
                value={Math.min(value ?? 0, metric.target)}
              />
              <p>{metric.detail}</p>
            </div>
          );
        })}
      </div>
      <div className="harvest-result">
        <BookOpen size={18} />
        <p>
          <strong>
            {harvest
              ? harvest.researchReady
                ? "Today’s research threshold is met."
                : "The colony is still gathering today’s harvest."
              : "Reading the colony’s saved evidence…"}
          </strong>
          <span>
            Buybacks remain inactive. Token, creator-fee receipts, execution
            wallet and spending limits are not connected.
          </span>
        </p>
        <a href="/library/">
          Inspect sources <ArrowUpRight size={15} />
        </a>
      </div>
      {harvest && harvest.domainNames.length > 0 && (
        <div className="harvest-domains">
          <span>Today’s domains</span>
          {harvest.domainNames.map((domain) => (
            <code key={domain}>{domain}</code>
          ))}
        </div>
      )}
      {harvest && harvest.reports.length > 0 && (
        <div className="harvest-evidence">
          <span className="harvest-eyebrow">QUALIFYING RESEARCH</span>
          {harvest.reports.slice(0, 3).map((report) => (
            <a key={report.id} href="/queen/">
              <span>{report.question}</span>
              <small>
                {report.sourceCount} cited sources <ArrowUpRight size={13} />
              </small>
            </a>
          ))}
        </div>
      )}
      <details className="harvest-example">
        <summary>
          Explore a funding example <span>Illustration only</span>
        </summary>
        <p>
          Use any paired-asset units. These inputs are examples, not wallet
          balances or a transaction.
        </p>
        <div className="harvest-calculator">
          <label>
            Creator rewards received
            <input
              type="number"
              min="0"
              max="1000000000"
              value={exampleFees}
              onChange={(e) => setExampleFees(e.target.value)}
            />
          </label>
          <label>
            Required operating holdback
            <input
              type="number"
              min="0"
              max="1000000000"
              value={exampleReserve}
              onChange={(e) => setExampleReserve(e.target.value)}
            />
          </label>
          <div>
            <span>Illustrative buyback ceiling</span>
            <strong>
              {amount(exampleBudget)} <small>units</small>
            </strong>
            <small>
              Only after research qualifies and execution is configured.
            </small>
          </div>
        </div>
      </details>
      <footer className="harvest-footer">
        <p>
          Proposed destination: a public colony reserve holding purchased $ANT.
          A future receipt would link the research bundle, fee funding and
          confirmed transaction. Buybacks do not guarantee token value.
        </p>
        <a
          href="https://pump.fun/docs/custom-pairs"
          target="_blank"
          rel="noreferrer"
        >
          Pump pairing & fee denomination <ArrowUpRight size={13} />
        </a>
      </footer>
    </section>
  );
}
