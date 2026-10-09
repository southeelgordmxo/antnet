"use client";
/* Native links are shared with the portable React build, which has no Next router. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { useEffect, useMemo, useState } from "react";
import { Download, Search, Pause, Play, X, ExternalLink } from "lucide-react";
import type { Colony } from "./antnet";
import { readApiResponse } from "../../../lib/api-response";
const domain = (url: string) => new URL(url).hostname;
const chapter = (url: string) =>
  /whitepaper|\.pdf/.test(url)
    ? "whitepapers"
    : /forum|discourse/.test(url)
      ? "forums"
      : /blog|news/.test(url)
        ? "blogs"
        : /github/.test(url)
          ? "code"
          : "documentation";
const stamp = (date: string) => new Date(date).toLocaleString();
async function post(path: string, body: object) {
  const res = await fetch("/api/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readApiResponse(res);
}
type Controls = {
  colony: Colony;
  refresh: () => Promise<Colony | null>;
  notify: (value: string) => void;
};
export function ColonyControls({ colony, refresh, notify }: Controls) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const ant = colony.ants.find((a) => a.id === selected);
  async function pause(id: string, value: boolean) {
    try {
      await post("ant/update", { id, paused: value });
      await refresh();
      notify(value ? "Ant paused. Queued work will wait." : "Ant resumed.");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <section className="research-section">
      <div className="section-toolbar">
        <h2>colony process board</h2>
        <div className="search-field">
          <Search size={15} />
          <input
            aria-label="Search ants"
            placeholder="find an ant…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ANT</th>
              <th>STATUS</th>
              <th>PAGES</th>
              <th>JOINED</th>
              <th>CONTROLS</th>
            </tr>
          </thead>
          <tbody>
            {colony.ants
              .filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
              .map((a) => (
                <tr key={a.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => setSelected(a.id)}
                    >
                      {a.name}
                    </button>
                  </td>
                  <td>
                    {a.paused
                      ? "paused"
                      : colony.orders.some(
                            (o) => o.ant_id === a.id && o.status === "reading",
                          )
                        ? "reading"
                        : "idle"}
                  </td>
                  <td>{a.pages}</td>
                  <td>{stamp(a.created)}</td>
                  <td>
                    <button
                      className="button"
                      onClick={() => void pause(a.id, !a.paused)}
                    >
                      {a.paused ? <Play size={13} /> : <Pause size={13} />}{" "}
                      {a.paused ? "resume" : "pause"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {ant && (
        <div className="detail-panel">
          <div className="section-toolbar">
            <h2>{ant.name} / field notebook</h2>
            <button
              aria-label="Close ant details"
              onClick={() => setSelected("")}
            >
              <X size={18} />
            </button>
          </div>
          <p className="muted">
            {ant.pages} pages · joined {stamp(ant.created)}
          </p>
          <div className="ant-notebook">
            {colony.documents
              .filter((d) => d.ant_id === ant.id)
              .map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noreferrer">
                  <span>{d.title}</span>
                  <small>
                    {domain(d.url)} · ~{d.tokens} tokens
                  </small>
                  <ExternalLink size={14} />
                </a>
              ))}
          </div>
          <h3>recent activity</h3>
          {colony.events
            ?.filter((e) => e.ant_id === ant.id)
            .slice(0, 12)
            .map((e) => (
              <div className="event-row" key={e.id}>
                <time>{new Date(e.created).toLocaleTimeString()}</time>
                <b>{e.kind}</b>
                <span>{e.message}</span>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
export function CrawlControls({ colony, refresh, notify }: Controls) {
  const [selected, setSelected] = useState("");
  const order = colony.orders.find((o) => o.id === selected);
  async function cancel(id: string) {
    try {
      await post("order/cancel", { id });
      await refresh();
      notify("Expedition cancelled. Already collected sources are retained.");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <section className="research-section">
      <h2>reports & queue controls</h2>
      <p className="muted small">
        {colony.config.operatorRequired
          ? "Expeditions run in the background once the operator starts them. Saved reports stay available after the page closes."
          : "Crawls progress while AntNet is open. The self-hosted colony can run independently."}
      </p>
      <div className="job-list">
        {colony.orders.map((o) => (
          <div key={o.id}>
            <button className="text-link" onClick={() => setSelected(o.id)}>
              {domain(o.url)}
            </button>
            <span>
              {o.pages}/{o.target} new pages · {o.reads} reads
            </span>
            <span className="tag">{o.status}</span>
            {["queued", "reading"].includes(o.status) && (
              <button
                aria-label={`Cancel expedition ${o.id}`}
                onClick={() => void cancel(o.id)}
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      {order && (
        <div className="detail-panel">
          <div className="section-toolbar">
            <h2>expedition report</h2>
            <button aria-label="Close report" onClick={() => setSelected("")}>
              <X size={18} />
            </button>
          </div>
          <a
            href={order.url}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            {order.url}
          </a>
          <p>{order.message}</p>
          <p className="muted small">
            {order.pages} pages saved · {order.reads} pages attempted ·{" "}
            {stamp(order.created)}
          </p>
          {colony.events
            ?.filter((e) => e.order_id === order.id)
            .map((e) => (
              <div className="event-row" key={e.id}>
                <time>{new Date(e.created).toLocaleTimeString()}</time>
                <b>{e.kind}</b>
                <a href={e.url} target="_blank" rel="noreferrer">
                  {e.message}
                </a>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
export function ResearchTools({ colony }: { colony: Colony }) {
  const groups = useMemo(
    () =>
      Object.entries(
        colony.documents.reduce<Record<string, number>>((a, d) => {
          a[domain(d.url)] = (a[domain(d.url)] || 0) + 1;
          return a;
        }, {}),
      ).sort((a, b) => b[1] - a[1]),
    [colony.documents],
  );
  const chapters = useMemo(
    () =>
      colony.documents.reduce<Record<string, number>>((a, d) => {
        a[chapter(d.url)] = (a[chapter(d.url)] || 0) + 1;
        return a;
      }, {}),
    [colony.documents],
  );
  return (
    <section className="research-section">
      <div className="section-toolbar">
        <h2>dataset.map</h2>
        <a href="/library/" className="text-link">
          inspect every source
        </a>
      </div>
      <div className="dataset-grid">
        <div className="dataset-map">
          <svg
            viewBox="0 0 600 320"
            role="img"
            aria-label={`Source map connecting Claude to ${groups.length} domains`}
          >
            <circle cx="300" cy="160" r="39" fill="#cc785b" />
            <text
              x="300"
              y="164"
              textAnchor="middle"
              fill="#292723"
              fontSize="13"
              fontFamily="monospace"
            >
              CLAUDE
            </text>
            {groups.slice(0, 10).map(([host, count], i) => {
              const angle = (i * Math.PI * 2) / Math.min(groups.length, 10);
              const x = 300 + 210 * Math.cos(angle);
              const y = 160 + 115 * Math.sin(angle);
              return (
                <g key={host}>
                  <line
                    x1="300"
                    y1="160"
                    x2={x}
                    y2={y}
                    stroke="#b9ae9b"
                    strokeDasharray="3 5"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={9 + Math.min(count, 12)}
                    fill="#d8c4b3"
                    stroke="#b75d43"
                  />
                  <text
                    x={x}
                    y={y + 32}
                    textAnchor="middle"
                    fill="#797368"
                    fontSize="10"
                  >
                    {host}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="small muted">
            Source groups by domain · latest {colony.documents.length} pages
          </p>
        </div>
        <div className="chapters">
          <h3>chapters</h3>
          {["documentation", "whitepapers", "forums", "blogs", "code"].map(
            (c) => (
              <div key={c}>
                <span>{c}</span>
                <b>{chapters[c] || 0}</b>
                <progress
                  aria-label={`${c} share`}
                  max={Math.max(colony.documents.length, 1)}
                  value={chapters[c] || 0}
                />
              </div>
            ),
          )}
          <p className="small muted">Categories inferred from source URLs.</p>
        </div>
      </div>
      <div className="connection-strip">
        <span>
          <b>01</b> crawl & extract
        </span>
        <span>
          <b>02</b> deduplicate & save
        </span>
        <span>
          <b>03</b> retrieve context
        </span>
        <span>
          <b>04</b> Claude + citations
        </span>
      </div>
    </section>
  );
}
export function SourceLibrary({ colony }: { colony: Colony }) {
  const [query, setQuery] = useState("");
  const [host, setHost] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<{
    title: string;
    content: string;
    url: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState(colony.documents);
  const [total, setTotal] = useState(colony.documents.length);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const hosts = colony.config.domains;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      void fetch(
        "/api/library?" +
          new URLSearchParams({
            q: query,
            host: host === "all" ? "" : host,
            sort,
            offset: String(offset),
          }),
        { signal: controller.signal },
      )
        .then(async (r) => {
          const data = await readApiResponse(r);
          setDocs(data.documents);
          setTotal(data.total);
          setError("");
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, host, sort, offset]);
  async function open(id: string) {
    try {
      const r = await fetch("/api/document?id=" + encodeURIComponent(id));
      const data = await readApiResponse(r);
      setSelected(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-title">
        <h1>
          the colony’s memory<span>.</span>
        </h1>
        <a href="/api/export" className="button">
          <Download size={15} />
          export JSONL
        </a>
      </div>
      <p className="subtitle">
        # every finding has a source. search, read, and verify.
      </p>
      <div className="library-filters">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search sources"
            placeholder="search titles, domains, or excerpts…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <select
          aria-label="Filter source domain"
          value={host}
          onChange={(e) => {
            setHost(e.target.value);
            setOffset(0);
          }}
        >
          <option value="all">all domains</option>
          {hosts.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>
        <select
          aria-label="Sort sources"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setOffset(0);
          }}
        >
          <option value="newest">newest first</option>
          <option value="tokens">most tokens</option>
          <option value="title">title A–Z</option>
        </select>
      </div>
      <p className="small muted">
        {loading ? "searching…" : `${total} matching sources`} · export includes
        up to 500 full pages
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="library-layout">
        <div className="source-list">
          {docs.map((d) => (
            <article key={d.id}>
              <div>
                <span className="tag">{chapter(d.url)}</span>
                <small>{stamp(d.created)}</small>
              </div>
              <button onClick={() => void open(d.id)}>{d.title}</button>
              <p>{d.excerpt.slice(0, 180)}…</p>
              <footer>
                <a href={d.url} target="_blank" rel="noreferrer">
                  {domain(d.url)} <ExternalLink size={12} />
                </a>
                <span>~{d.tokens} tokens</span>
              </footer>
            </article>
          ))}
          {!docs.length && (
            <div className="empty-state">
              <h2>No matching sources.</h2>
              <p>Try a different search or send an ant to collect a page.</p>
              <a className="primary" href="/order/">
                start an expedition
              </a>
            </div>
          )}
        </div>
        {selected && (
          <aside className="document-reader">
            <button
              className="close-modal"
              aria-label="Close source reader"
              onClick={() => setSelected(null)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">SAVED SOURCE</span>
            <h2>{selected.title}</h2>
            <a
              className="text-link"
              href={selected.url}
              target="_blank"
              rel="noreferrer"
            >
              open original
            </a>
            <p>{selected.content}</p>
          </aside>
        )}
      </div>
      <div className="pagination">
        <button
          className="button"
          disabled={offset === 0 || loading}
          onClick={() => setOffset(Math.max(0, offset - 30))}
        >
          previous
        </button>
        <span>
          {total ? offset + 1 : 0}–{Math.min(offset + 30, total)} of {total}
        </span>
        <button
          className="button"
          disabled={offset + 30 >= total || loading}
          onClick={() => setOffset(offset + 30)}
        >
          next
        </button>
      </div>
    </>
  );
}
