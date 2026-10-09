"use client";
import { ResearchAnswer } from "./research-answer";
/* eslint-disable @next/next/no-img-element */
/* Native links are shared with the portable React build, which has no Next router. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Plus,
  Terminal,
  X,
  Activity,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { readApiResponse } from "../../../lib/api-response";
import { TreasuryPanel } from "./treasury";
import { LiveForagingPanel } from "./live-foraging";
import { LiveObservatory } from "./live-observatory";
import { ResearchProof } from "./research-proof";
import {
  ResearchTools,
  ColonyControls,
  CrawlControls,
  SourceLibrary,
} from "./research-tools";
type Ant = {
  id: string;
  name: string;
  pages: number;
  paused: number;
  created: string;
};
type Doc = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  tokens: number;
  ant_id: string;
  created: string;
};
type Order = {
  id: string;
  url: string;
  ant_id: string;
  pages: number;
  target: number;
  reads: number;
  status: string;
  message: string;
  created: string;
};
type Answer = {
  id: string;
  question: string;
  answer: string;
  sources: { number: number; title: string; url: string }[];
  created: string;
};
export type Colony = {
  ants: Ant[];
  documents: Doc[];
  orders: Order[];
  events?: {
    id: string;
    order_id: string;
    ant_id: string;
    kind: string;
    url: string;
    message: string;
    created: string;
  }[];
  answers: Answer[];
  stats: { pages: number; tokens: number };
  config: {
    operatorRequired?: boolean;
    operator?: boolean;
    continuous?: boolean;
    browser?: boolean;
    autopilot?: boolean;
    autopilotIntervalMinutes?: number;
    autopilotDailyLimit?: number;
    autopilotNextRun?: string;
    autopilotRunsToday?: number;
    claude: boolean;
    claudeStatus?: string;
    claudeError?: string;
    model: string;
    contract: string;
    treasury: string;
    pairUrl: string;
    domains: string[];
  };
};
type Provider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
};
const nav = [
  ["live", "/", "0:live"],
  ["crawlers", "/crawlers/", "1:ants"],
  ["queen", "/queen/", "2:queen"],
  ["treasury", "/treasury/", "3:treasury"],
  ["mint", "/mint/", "4:mint"],
  ["order", "/order/", "5:order"],
  ["man", "/man/", "6:manual"],
  ["library", "/library/", "7:library"],
];
const initial: Colony = {
  ants: [],
  documents: [],
  orders: [],
  answers: [],
  stats: { pages: 0, tokens: 0 },
  config: {
    claude: false,
    model: "Claude",
    contract: "",
    treasury: "",
    pairUrl: "",
    domains: [],
  },
};
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    notation: n > 9999 ? "compact" : "standard",
  }).format(n);
const host = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};
const time = (date: string) =>
  new Date(date).toLocaleTimeString("en-GB", { hour12: false });
async function api(path: string, data?: object) {
  const res = await fetch(
    `/api/${path}`,
    data
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      : undefined,
  );
  return readApiResponse(res);
}
export function AntNet({ view }: { view: string }) {
  const [colony, setColony] = useState<Colony>(initial);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState("");
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("https://ethereum.org/en/developers/docs/");
  const [antId, setAntId] = useState("");
  const [limit, setLimit] = useState("1");
  const [question, setQuestion] = useState("");
  const [filter, setFilter] = useState("all");
  const [clock, setClock] = useState("");
  const [operatorKey, setOperatorKey] = useState("");
  const [loginError, setLoginError] = useState("");
  const claudeLabel = !colony.config.claude
    ? "Claude connection pending"
    : colony.config.claudeStatus === "needs_credits"
      ? "Claude needs API credits"
      : colony.config.claudeStatus === "error"
        ? "Claude unavailable"
        : colony.config.claudeStatus === "ready"
          ? "Claude connected"
          : "Claude key configured";
  const refresh = useCallback(async () => {
    try {
      const data = await api("state");
      setColony(data);
      setLoaded(true);
      setError("");
      return data as Colony;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, []);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 3000);
    const c = setInterval(
      () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false })),
      1000,
    );
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, [refresh]);
  useEffect(() => {
    if (
      !loaded ||
      colony.config.continuous ||
      (colony.config.operatorRequired && !colony.config.operator)
    )
      return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function advance() {
      try {
        await api("tick", {});
        if (!stopped) await refresh();
      } catch {
        /* Connection state is shown by refresh. */
      }
      if (!stopped)
        timer = setTimeout(
          () => void advance(),
          colony.config.continuous ? 60000 : 6000,
        );
    }
    void advance();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [
    refresh,
    loaded,
    colony.config.operatorRequired,
    colony.config.operator,
    colony.config.continuous,
  ]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 9000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: {
              name: string;
              description: string;
              inputSchema: object;
              annotations: object;
              execute: (input: unknown) => Promise<unknown>;
            },
            options: { signal: AbortSignal },
          ) => Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "read_colony",
          description:
            "Read saved AntNet ants, page counts and Claude connection status and refresh the visible colony.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async (input) => {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw new Error("Expected an empty object.");
            const state = await refresh();
            if (!state) throw new Error("Colony unavailable.");
            return {
              ants: state.ants,
              pages: state.stats.pages,
              claudeConnected: state.config.claude,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, [refresh]);
  const active = colony.orders.filter((o) => o.status === "reading");
  async function forageNow() {
    setBusy(true);
    try {
      await api("forage", {});
      await refresh();
      setToast(
        "Expedition dispatched. Watch the scout collect sources and send them to Claude.",
      );
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Could not dispatch the scout.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function createAnt(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const ant = await api("ants", { name });
      setAntId(ant.id);
      await refresh();
      setName("");
      setToast(`${ant.name} has joined the colony.`);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function crawl(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setToast("Your ant is checking robots.txt and reading the source.");
    try {
      const result = await api("crawl", {
        url,
        antId: antId || colony.ants[0]?.id,
        limit: Number(limit),
      });
      await refresh();
      setToast(result.message);
    } catch (e) {
      setToast((e as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("ask", { question });
      setQuestion("");
      await refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    const provider = (window as Window & { solana?: Provider }).solana;
    if (!provider?.isPhantom) {
      setModal("wallet");
      return;
    }
    try {
      if (wallet) {
        await provider.disconnect();
        setWallet("");
      } else {
        const result = await provider.connect();
        setWallet(result.publicKey.toString());
        setToast("Wallet connected. No transaction requested.");
      }
    } catch {
      setToast("Wallet connection was cancelled or unavailable.");
    }
  }
  async function loginOperator(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      await api("session", { key: operatorKey });
      setOperatorKey("");
      setModal("");
      await refresh();
      setToast("Operator session opened for 8 hours.");
    } catch (error) {
      setLoginError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logoutOperator() {
    await fetch("/api/session", { method: "DELETE" });
    await refresh();
    setToast("Operator signed out.");
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast("Copied to clipboard.");
    } catch {
      setToast("Clipboard unavailable.");
    }
  }
  const commands: Record<string, string> = {
    live: "ant status --live",
    crawlers: "ants watch --all",
    queen: "queen research --claude",
    treasury: "treasury --flow",
    mint: "ant.md --create",
    order: "ant crawl --url",
    man: "man antnet",
    library: "corpus search --all",
  };
  const title = (
    <div className="prompt">
      <span>~/antnet</span>
      <b>❯</b>
      {commands[view]}
    </div>
  );
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="AntNet home">
          <img src="/favicon.svg" alt="" width="32" height="32" />
        </a>
        <nav aria-label="Main navigation">
          {nav.map(([key, href, label]) => (
            <a
              key={key}
              href={href}
              className={cn(view === key && "selected")}
              aria-current={view === key ? "page" : undefined}
            >
              {label}
              {view === key ? "*" : ""}
            </a>
          ))}
          <a
            href="https://github.com/southeelgordmxo/antnet"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub — AntNet code and documentation (opens in a new tab)"
          >
            GitHub ↗
          </a>
        </nav>
        <div className="nav-right">
          {colony.config.operatorRequired ? (
            <button
              onClick={() =>
                colony.config.operator
                  ? void logoutOperator()
                  : setModal("operator")
              }
            >
              {colony.config.operator ? "sign out" : "operator"}
            </button>
          ) : (
            <span className="prelaunch">pre-launch</span>
          )}
          <button onClick={() => void connect()}>
            {wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "connect"}
          </button>
          {colony.config.contract ? (
            <a
              className="buy"
              href={`https://pump.fun/coin/${encodeURIComponent(colony.config.contract)}`}
              target="_blank"
              rel="noreferrer"
            >
              buy $ANT
            </a>
          ) : (
            <button className="buy" onClick={() => setModal("token")}>
              $ANT <span>soon</span>
            </button>
          )}
        </div>
      </header>
      {colony.config.operatorRequired && !colony.config.operator && (
        <div className="access-banner">
          <span>
            Explore the colony. Operator access unlocks expeditions and Claude
            research.
          </span>
          <button onClick={() => setModal("operator")}>
            operator sign in ↗
          </button>
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button
            onClick={() =>
              error.includes("hosting session")
                ? window.location.reload()
                : void refresh()
            }
          >
            {error.includes("hosting session")
              ? "reload & sign in"
              : "retry connection"}
          </button>
        </div>
      )}
      {view === "live" ? (
        <main className="live-grid live-v2">
          <section className="intro">
            {title}
            <div className="wordmark-wrap">
              <h1 className="wordmark">
                antnet<span>01</span>
              </h1>
              <span className="edition">
                COLLECTIVE
                <br />
                INTELLIGENCE / 01
              </span>
            </div>
            <h2 className="hero-copy">
              <b>❯</b> small ants. a vast crypto web.
              <br />
              one collective intelligence.
            </h2>
            <p className="hero-detail">
              # ants forage for knowledge. Claude connects the dots.
              <br />
              every source collected. every answer traceable.
            </p>
            <div className="inline-stats">
              <span>
                <strong>{loaded ? colony.ants.length : "—"}</strong> ants in
                colony
              </span>
              <span>
                <strong>{loaded ? fmt(colony.stats.pages) : "—"}</strong> pages
                read
              </span>
              <span>
                <strong>{loaded ? fmt(colony.stats.tokens) : "—"}</strong> est.
                tokens
              </span>
              <span>
                queen <strong>Claude</strong>
              </span>
            </div>
            <div className="contract">
              <span>$ANT</span>
              <code>
                {colony.config.contract ||
                  "contract address announced at launch"}
              </code>
              <button
                aria-label="Copy token address"
                disabled={!colony.config.contract}
                onClick={() => void copy(colony.config.contract)}
              >
                <Copy size={15} />
              </button>
            </div>
            <a className="harvest-callout" href="/treasury/">
              <strong>50%</strong>
              <span>
                Research feeds the colony.
                <small>
                  Proposed creator-reward buybacks · execution inactive
                </small>
              </span>
              <ExternalLink size={14} />
            </a>
            <div className="actions">
              <a className="primary" href="/order/">
                <Terminal size={16} />
                send an ant
              </a>
              <a className="button" href="/mint/">
                create an ant.md identity
              </a>
            </div>
            <a className="manual-link" href="/man/">
              <b>❯</b> manual <span>how the colony works</span>
            </a>
            <div className="intro-foot">
              <span>01 / FORAGE</span>
              <i>········</i>
              <span>02 / COLLECT</span>
              <i>········</i>
              <span>03 / REASON</span>
            </div>
          </section>
          <LiveObservatory
            colony={colony}
            loaded={loaded}
            busy={busy}
            forage={forageNow}
            refresh={refresh}
          />
          <ResearchProof colony={colony} loaded={loaded} />
          <section className="process-panel">
            <div className="process-summary">
              <div>
                <span>1</span>
                <b>
                  [{"|".repeat(Math.min(active.length, 15))}
                  <i>{active.length} reading</i>]
                </b>
              </div>
              <div>
                <span>2</span>
                <b>
                  [{"|".repeat(Math.min(colony.stats.pages, 15))}
                  <i>{fmt(colony.stats.pages)} pages saved</i>]
                </b>
              </div>
              <div>
                <span>Q</span>
                <b>
                  [<i>{claudeLabel}</i>]
                </b>
              </div>
            </div>
            <div className="process-info">
              <p>
                Tasks: <strong>{colony.ants.length + 1}</strong>,{" "}
                {colony.ants.length} ants, 1 queen
              </p>
              <p>
                Corpus: <strong>{fmt(colony.stats.tokens)}</strong> estimated
                tokens
              </p>
              <p>
                Model: <strong>Claude</strong> / source-grounded research
              </p>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>PROCESS</th>
                    <th>S</th>
                    <th>HOST</th>
                    <th>PAGES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>4000</td>
                    <td className="accent">queen</td>
                    <td>{colony.config.claude ? "R" : "W"}</td>
                    <td>anthropic</td>
                    <td>{colony.stats.pages}</td>
                  </tr>
                  {colony.ants.slice(0, 3).map((a, i) => (
                    <tr key={a.id}>
                      <td>{4001 + i}</td>
                      <td>{a.name}</td>
                      <td>
                        {active.some((o) => o.ant_id === a.id) ? "R" : "I"}
                      </td>
                      <td>colony</td>
                      <td>{a.pages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="feed-panel">
            <div className="log-heading">
              <span>
                <b>❯</b> colony events
              </span>
              <Activity size={14} />
            </div>
            {(colony.events || [])
              .filter((e) => e.kind !== "frame")
              .slice(0, 7)
              .map((e) => (
                <div className="feed-entry" key={e.id} title={e.message}>
                  <time>{time(e.created)}</time>
                  <b>{e.kind.toUpperCase()}</b>
                  <span>{e.message}</span>
                </div>
              ))}
            {!colony.orders.length && (
              <div className="feed-empty">
                <span>--:--:--</span>
                <b>queen</b>
                <span>waiting for the ants to bring something home.</span>
              </div>
            )}
            <a href="/crawlers/" className="feed-link">
              colony directory <span>{colony.ants.length} ants</span>
            </a>
          </section>
          <details className="colony-details">
            <summary>
              Colony controls &amp; expanded activity{" "}
              <span>Autopilot · observer selection · source handoff +</span>
            </summary>
            <LiveForagingPanel
              colony={colony}
              refresh={refresh}
              notify={setToast}
            />
          </details>
        </main>
      ) : (
        <main className="route-page">
          {title}
          {view === "crawlers" && (
            <>
              <div className="page-title">
                <h1>
                  the colony<span>.</span>
                </h1>
                <a className="primary" href="/mint/">
                  <Plus size={16} />
                  create an ant
                </a>
              </div>
              <p className="subtitle">
                # independent scouts. shared knowledge. {active.length} reading
                of {colony.ants.length} ants.
              </p>
              <div className="tabs">
                {["all", "reading", "idle"].map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "active" : ""}
                    onClick={() => setFilter(f)}
                  >
                    [{f[0]}]{f.slice(1)}
                  </button>
                ))}
                <a href="/api/export">
                  <Download size={14} />
                  export corpus
                </a>
              </div>
              <div className="ant-cards">
                {colony.ants
                  .filter(
                    (a) =>
                      filter === "all" ||
                      (filter === "reading") ===
                        active.some((o) => o.ant_id === a.id),
                  )
                  .map((a) => (
                    <article className="ant-card" key={a.id}>
                      <div className="panel-bar">
                        <b>{a.name}</b>
                        <span>
                          {active.some((o) => o.ant_id === a.id)
                            ? "reading"
                            : "idle"}
                        </span>
                      </div>
                      <div className="card-ant">
                        <img src="/ant.png" alt="Ant scout" />
                      </div>
                      <div className="ant-card-details">
                        <span>{a.pages} pages collected</span>
                        <a href="/order/">assign a source</a>
                      </div>
                    </article>
                  ))}
              </div>
              {colony.ants.length === 0 && (
                <div className="empty-state">
                  <Terminal />
                  <h2>No ants in the colony yet.</h2>
                  <p>
                    Create a research identity, then give it a source to read.
                  </p>
                  <a href="/mint/" className="primary">
                    create your first ant
                  </a>
                </div>
              )}
            </>
          )}
          {view === "queen" && (
            <>
              <div className="page-title">
                <h1>
                  meet the queen<span>.</span>
                </h1>
                <span className="tag">
                  CLAUDE / {claudeLabel.toUpperCase()}
                </span>
              </div>
              <p className="subtitle">
                # the ants bring the sources. the queen makes sense of them.
              </p>
              <div className="queen-layout">
                <aside className="knowledge">
                  <div className="panel-bar">colony knowledge</div>
                  <div className="knowledge-count">
                    {fmt(colony.stats.pages)}
                    <span>pages in context library</span>
                  </div>
                  <dl>
                    <dt>estimated tokens</dt>
                    <dd>{fmt(colony.stats.tokens)}</dd>
                    <dt>research model</dt>
                    <dd>{colony.config.model}</dd>
                    <dt>method</dt>
                    <dd>retrieval + citations</dd>
                  </dl>
                  <h3>sources</h3>
                  {colony.documents.slice(0, 8).map((d) => (
                    <a key={d.id} href={d.url} target="_blank" rel="noreferrer">
                      <BookOpen size={14} />
                      {d.title}
                    </a>
                  ))}
                  {!colony.documents.length && (
                    <p className="muted">
                      The library is empty. Send an ant to collect your first
                      page.
                    </p>
                  )}
                </aside>
                <section className="queen-chat">
                  <div className="queen-intro">
                    <span className="queen-symbol">✳</span>
                    <h2>
                      A little curiosity.
                      <br />A lot of collective knowledge.
                    </h2>
                    <p>
                      Ask about the crypto sources your ants have collected.
                    </p>
                  </div>
                  {!colony.config.claude && (
                    <div className="notice">
                      Claude is awaiting its API connection. You can still
                      collect and browse sources.
                    </div>
                  )}
                  {colony.config.claudeError && (
                    <div className="notice">
                      <p>{colony.config.claudeError}</p>
                      {colony.config.operator &&
                        colony.config.claudeStatus === "needs_credits" && (
                          <a
                            href="https://platform.claude.com/settings/billing"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Claude billing ↗
                          </a>
                        )}
                    </div>
                  )}
                  <div className="answers">
                    {[...colony.answers].reverse().map((a) => (
                      <article key={a.id}>
                        <h3>you ❯ {a.question}</h3>
                        <div className="answer-label">✳ queen / Claude</div>
                        <ResearchAnswer answer={a.answer} sources={a.sources} />
                        <div className="citations">
                          {a.sources.map((s) => (
                            <a
                              key={s.number}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              [{s.number}] {s.title}
                            </a>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="suggestions">
                    {[
                      "What did the ants learn?",
                      "Explain the key risks",
                      "Compare these protocols",
                    ].map((q) => (
                      <button key={q} onClick={() => setQuestion(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                  <form className="ask-form" onSubmit={ask}>
                    <label htmlFor="question">queen ❯</label>
                    <input
                      id="question"
                      required
                      maxLength={1000}
                      placeholder="ask about the colony’s sources…"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                    />
                    <button className="primary" disabled={busy}>
                      {busy ? "thinking…" : "ask ↵"}
                    </button>
                  </form>
                </section>
              </div>
            </>
          )}
          {view === "order" && (
            <>
              <h1>
                give an ant a trail<span>.</span>
              </h1>
              <p className="subtitle">
                # a source becomes knowledge. send your ant into the crypto web.
              </p>
              <div className="order-grid">
                <section className="form-panel">
                  <div className="panel-bar">new expedition</div>
                  <form className="stack" onSubmit={crawl}>
                    <label htmlFor="source">--url</label>
                    <input
                      id="source"
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <div className="form-row">
                      <div>
                        <label htmlFor="scout">--ant</label>
                        <select
                          id="scout"
                          value={antId || colony.ants[0]?.id || ""}
                          onChange={(e) => setAntId(e.target.value)}
                        >
                          {!colony.ants.length && (
                            <option value="">create an identity first</option>
                          )}
                          {colony.ants.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="depth">--pages</label>
                        <select
                          id="depth"
                          value={limit}
                          onChange={(e) => setLimit(e.target.value)}
                        >
                          <option value="1">1 page</option>
                          <option value="2">up to 2 pages</option>
                          <option value="3">up to 3 pages</option>
                          <option value="10">up to 10 pages</option>
                          <option value="25">up to 25 pages</option>
                        </select>
                      </div>
                    </div>
                    <button
                      className="primary"
                      disabled={busy || !colony.ants.length || !loaded}
                    >
                      <Terminal size={16} />
                      {busy ? "ant is foraging…" : "start expedition"}
                    </button>
                    {!colony.ants.length && (
                      <a href="/mint/">Create an ant to start.</a>
                    )}
                    <p className="small muted">
                      Public HTML and text PDFs. Robots rules checked before
                      reading. PDFs: up to 8 MB / 40 pages; one PDF counts as
                      one source. Changed sources refreshed. No token burn
                      during pre-launch.
                    </p>
                  </form>
                </section>
                <aside className="trail-info">
                  <span className="eyebrow">THE FORAGING LOOP</span>
                  <ol>
                    <li>
                      <b>01</b>
                      <div>
                        <strong>Read the source</strong>
                        <p>Your ant extracts web pages and whitepaper text.</p>
                      </div>
                    </li>
                    <li>
                      <b>02</b>
                      <div>
                        <strong>Bring it to the colony</strong>
                        <p>Text and source links are saved together.</p>
                      </div>
                    </li>
                    <li>
                      <b>03</b>
                      <div>
                        <strong>Let Claude connect the dots</strong>
                        <p>
                          New pages are sent to Claude for cited research when
                          connected.
                        </p>
                      </div>
                    </li>
                  </ol>
                </aside>
              </div>
              <div className="source-pills">
                <span>approved sources:</span>
                {colony.config.domains.map((d) => (
                  <button key={d} onClick={() => setUrl(`https://${d}/`)}>
                    {d}
                  </button>
                ))}
              </div>
              <h2 className="section-title">expedition log</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>SOURCE</th>
                      <th>STATUS</th>
                      <th>PAGES</th>
                      <th>RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colony.orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <a href={o.url} target="_blank" rel="noreferrer">
                            {host(o.url)}
                          </a>
                        </td>
                        <td>
                          <span className="tag">{o.status}</span>
                        </td>
                        <td>{o.pages}</td>
                        <td>{o.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!colony.orders.length && (
                  <p className="table-empty">
                    No expeditions yet. Every trail starts with one page.
                  </p>
                )}
              </div>
            </>
          )}
          {view === "mint" && (
            <>
              <h1>
                every ant has a name<span>.</span>
              </h1>
              <p className="subtitle">
                # ant.md — your research identity in the colony.
              </p>
              <div className="mint-grid">
                <div className="identity-card">
                  <div className="panel-bar">
                    ANTNET / GENESIS COLONY <span>ant.md</span>
                  </div>
                  <img src="/ant.png" alt="AntNet engraved ant identity" />
                  <div className="identity-bottom">
                    <h2>{name || "your_ant"}</h2>
                    <span>SCOUT / GEN 01</span>
                  </div>
                </div>
                <section className="mint-details">
                  <span className="eyebrow">JOIN THE COLONY</span>
                  <h2>
                    Small scout.
                    <br />
                    Shared purpose.
                  </h2>
                  <p>
                    Name your ant, assign it a source, and add what it finds to
                    the colony’s research library.
                  </p>
                  <form className="stack" onSubmit={createAnt}>
                    <label htmlFor="ant-name">--name</label>
                    <input
                      id="ant-name"
                      required
                      minLength={2}
                      maxLength={24}
                      pattern="[a-zA-Z0-9_-]+"
                      placeholder="scout_001"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <button className="primary" disabled={busy || !loaded}>
                      <Plus size={16} />
                      {busy ? "creating…" : "create ant identity"}
                    </button>
                    <p className="muted small">
                      Free research identity. Saved to this colony. On-chain
                      minting is not live.
                    </p>
                  </form>
                  <div className="metric-line">
                    <span>colony identities</span>
                    <strong>{colony.ants.length} / 1,000</strong>
                  </div>
                </section>
              </div>
            </>
          )}
          {view === "treasury" && <TreasuryPanel colony={colony} />}
          {view === "man" && (
            <>
              <h1>
                colony field manual<span>.</span>
              </h1>
              <p className="subtitle">
                ANTNET(1) <span className="muted">Research Colony Manual</span>
              </p>
              <div className="manual">
                <section>
                  <h2>NAME</h2>
                  <p>
                    antnet — ants collect the crypto web; Claude turns their
                    findings into source-grounded research.
                  </p>
                </section>
                <section>
                  <h2>SYNOPSIS</h2>
                  <pre>
                    create ant → assign source → read → save → ask Claude
                  </pre>
                </section>
                <section>
                  <h2>THE COLONY</h2>
                  <dl>
                    <dt>forage</dt>
                    <dd>
                      Choose an approved source and an ant. Each expedition
                      collects up to 25 new pages on one site, with a 100-read
                      cap and three-hour deadline. Jobs and reports are saved.
                      Hosted expeditions continue in the background after the
                      operator starts them. The self-hosted colony can also
                      process them continuously.
                    </dd>
                    <dt>collect</dt>
                    <dd>
                      Readable HTML and PDF text is saved with its URL and ant
                      identity. Changed sources are refreshed without increasing
                      new-page counts. Unchanged duplicates are skipped. Token
                      counts are estimates. PDFs are limited to 8 MB, 40 pages
                      and 24,000 extracted characters; scans need OCR, which is
                      not connected. JavaScript rendering and screenshots are
                      available when the self-hosted browser service is
                      connected.
                    </dd>
                    <dt>queen</dt>
                    <dd>
                      When connected, Claude receives new page excerpts for
                      research. Questions retrieve up to six relevant saved
                      pages. Answers include source references. This adds
                      context to Claude; it does not retrain Claude or change
                      its weights.
                    </dd>
                    <dt>observe</dt>
                    <dd>
                      The live view shows saved text, crawl activity and real
                      database counts. It is a collected-source reader, not a
                      live browser video stream.
                    </dd>
                    <dt>ant.md</dt>
                    <dd>
                      A persistent research identity in this colony. Pre-launch
                      identities are free and off-chain. Wallet connection does
                      not mint a token or prove ownership of an identity.
                    </dd>
                    <dt>token</dt>
                    <dd>
                      $ANT is planned for pump.fun with an Anthropic-themed
                      pairing. Trading and on-chain features require the final
                      contract and verified pair. No purchases, burns, fee
                      collection or payouts run in this release.
                    </dd>
                  </dl>
                </section>
                <section>
                  <h2>GET STARTED</h2>
                  <ol>
                    <li>
                      <a href="/mint/">Create your ant.</a> Pick a name for its
                      identity.
                    </li>
                    <li>
                      <a href="/order/">Start an expedition.</a> Choose a public
                      crypto source.
                    </li>
                    <li>
                      <a href="/queen/">Ask the queen.</a> Claude uses the saved
                      sources when connected.
                    </li>
                  </ol>
                </section>
                <section>
                  <h2>SOURCES & ACCESS</h2>
                  <p>
                    The crawler respects robots.txt, checks redirects, limits
                    page sizes, and fetches only approved hosts. Source text is
                    untrusted material. The colony is private by default;
                    collected pages and research are shared within this site.
                  </p>
                  <a href="/api/export" className="button">
                    <Download size={16} />
                    download collected corpus
                  </a>
                </section>
                <section>
                  <h2>CONNECTIONS</h2>
                  <p>
                    Claude: {claudeLabel}. Token:{" "}
                    {colony.config.contract ? "configured" : "awaiting launch"}.
                    The owner configures credentials on the server; keys are
                    never stored in this browser.
                  </p>
                </section>
                <section>
                  <h2>ABOUT</h2>
                  <p>
                    An independent ant-themed adaptation inspired by{" "}
                    <a
                      href="https://crawlnet.network/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      CrawlNet
                    </a>
                    , built from the{" "}
                    <a
                      href="https://github.com/JCodesMore/ai-website-cloner-template"
                      target="_blank"
                      rel="noreferrer"
                    >
                      JCodesMore cloning template
                    </a>
                    . AntNet is not affiliated with Anthropic or CrawlNet.
                  </p>
                </section>
              </div>
            </>
          )}
          {view === "crawlers" && (
            <ColonyControls
              colony={colony}
              refresh={refresh}
              notify={setToast}
            />
          )}
          {view === "order" && (
            <CrawlControls
              colony={colony}
              refresh={refresh}
              notify={setToast}
            />
          )}
          {view === "queen" && <ResearchTools colony={colony} />}
          {view === "library" && <SourceLibrary colony={colony} />}
        </main>
      )}
      <footer className="statusbar">
        <a href="/">antnet</a>
        <span>“small ants. big ideas.”</span>
        <div>
          <span className={cn("status-dot", loaded && !error && "working")} />
          {error ? "reconnecting" : loaded ? "colony online" : "connecting"}
          <span className="footer-model">queen: Claude</span>
          <time>{clock || "--:--:--"}</time>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal("")}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="close-modal"
              aria-label="Close dialog"
              onClick={() => setModal("")}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">ANTNET / PRE-LAUNCH</span>
            <h2 id="modal-title">
              {modal === "operator"
                ? "Colony operator."
                : modal === "wallet"
                  ? "Connect your wallet."
                  : "The colony comes first."}
            </h2>
            {modal === "operator" ? (
              <form
                className="operator-form"
                onSubmit={(event) => void loginOperator(event)}
              >
                <p>
                  Everyone can explore the collected research. Operator access
                  unlocks ants, expeditions, and Claude questions.
                </p>
                <label htmlFor="operator-key">Private operator key</label>
                <input
                  id="operator-key"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={operatorKey}
                  onChange={(event) => setOperatorKey(event.target.value)}
                />
                {loginError && <p role="alert">{loginError}</p>}
                <button className="primary" disabled={busy} type="submit">
                  {busy ? "signing in…" : "sign in"}
                </button>
              </form>
            ) : modal === "wallet" ? (
              <>
                <p>
                  Use a browser with the Phantom Solana wallet extension to
                  connect. No transaction or signature is needed to explore the
                  research colony.
                </p>
                <a
                  href="https://phantom.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="primary"
                >
                  visit Phantom <ExternalLink size={15} />
                </a>
              </>
            ) : (
              <>
                <p>
                  $ANT is planned for pump.fun. The verified contract and
                  trading pair will be added after launch.
                </p>
                <p className="muted">
                  Until then, create an ant and start collecting knowledge.
                </p>
                <a href="/mint/" className="primary">
                  create an ant
                </a>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
