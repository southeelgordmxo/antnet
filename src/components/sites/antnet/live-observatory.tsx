"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Radio,
  Pause,
  Play,
} from "lucide-react";
import type { Colony } from "./antnet";
import { BrowserFrame } from "./live-foraging";
import { AntScout } from "./ant-scout";
import { useScoutActivity } from "./use-scout-activity";
import { readApiResponse } from "../../../lib/api-response";
import "./live-observatory.css";

const stamp = (value: string) =>
  new Date(value).toLocaleTimeString("en-GB", { hour12: false });
const host = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "Waiting for a source";
  }
};
type Props = {
  colony: Colony;
  loaded: boolean;
  busy: boolean;
  forage: () => Promise<void>;
  refresh: () => Promise<Colony | null>;
};
type Mode = "browser" | "text" | "events";

function SavedText({ doc }: { doc: Colony["documents"][number] }) {
  const [result, setResult] = useState<{ content?: string; error?: string }>(
    {},
  );
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/document?id=${encodeURIComponent(doc.id)}`, {
      signal: controller.signal,
    })
      .then(readApiResponse)
      .then((data) => setResult({ content: data.content }))
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ error: error.message });
      });
    return () => controller.abort();
  }, [doc.id]);
  return (
    <article className="observatory-text">
      <span className="observatory-eyebrow">
        SAVED SOURCE / {stamp(doc.created)}
      </span>
      <h3>{doc.title}</h3>
      <a href={doc.url} target="_blank" rel="noreferrer">
        {host(doc.url)} <ArrowUpRight size={12} />
      </a>
      <p>{result.content || doc.excerpt}</p>
      {!result.content && (
        <small role="status">
          {result.error || "Loading full saved text…"}
        </small>
      )}
    </article>
  );
}

export function LiveObservatory({
  colony,
  loaded,
  busy,
  forage,
  refresh,
}: Props) {
  const [mode, setMode] = useState<Mode>("browser");
  const [selectedId, setSelectedId] = useState("");
  const [antId, setAntId] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const scout = useScoutActivity(colony, antId);
  const patrolling =
    loaded && Boolean(scout.ant) && !scout.ant?.paused && !scout.fetching;
  const docs = colony.documents.filter((d) => !antId || d.ant_id === antId);
  const index = Math.max(
    0,
    docs.findIndex((d) => d.id === selectedId),
  );
  const doc = docs[index];
  const antEvents = scout.events.filter((e) => e.ant_id === scout.ant?.id);
  const collected = Math.max(
    scout.order?.pages || 0,
    new Set(
      antEvents
        .filter((e) => e.order_id === scout.order?.id && e.kind === "saved")
        .map((e) => e.url),
    ).size,
  );
  const frameUrl = scout.frame?.url || scout.currentUrl;
  const seconds = Math.max(
    0,
    Math.ceil(
      (Date.parse(colony.config.autopilotNextRun || "") - scout.now) / 1000,
    ),
  );
  const dailyFull =
    (colony.config.autopilotRunsToday ?? 0) >=
    (colony.config.autopilotDailyLimit ?? 12);
  const pending = colony.orders.some((o) =>
    ["reading", "queued"].includes(o.status),
  );
  const canOperate =
    !colony.config.operatorRequired || Boolean(colony.config.operator);
  const nextLabel = !loaded
    ? "Connecting to colony…"
    : pending
      ? scout.phase.toLowerCase()
      : !colony.config.autopilot
        ? "Autopilot paused"
        : dailyFull
          ? "Daily limit · resumes next UTC day"
          : !scout.now
            ? "Schedule syncing…"
            : seconds > 0
              ? `Next expedition in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
              : "Next expedition due · checking schedule";
  useEffect(() => {
    if (!expanded) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [expanded]);
  function previous(delta: number) {
    setSelectedId(docs[(index + delta + docs.length) % docs.length]?.id || "");
    setMode("text");
  }
  return (
    <section
      className={`observatory ${expanded ? "observatory-expanded" : ""}`}
      aria-label="Live colony observatory"
    >
      <header className="observatory-heading">
        <span className="observatory-eyebrow">
          <i className={scout.fetching ? "signal active" : "signal"} /> COLONY
          OBSERVATORY
        </span>
        <div>
          <button
            onClick={() => setMotionPaused((value) => !value)}
            aria-label={
              motionPaused ? "Resume ant animation" : "Pause ant animation"
            }
            title={
              motionPaused ? "Resume ant animation" : "Pause ant animation"
            }
            aria-pressed={motionPaused}
          >
            {motionPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            onClick={() => void refresh()}
            aria-label="Refresh observatory"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={
              expanded ? "Collapse observatory" : "Expand observatory"
            }
            aria-pressed={expanded}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>
      <div className="observatory-toolbar">
        <label>
          <span className="sr-only">Observe ant</span>
          <select
            aria-label="Observe ant"
            value={antId}
            onChange={(e) => setAntId(e.target.value)}
          >
            <option value="">Auto-follow scout</option>
            {colony.ants.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Observatory views">
          {(
            [
              ["browser", "Live browser"],
              ["text", "Saved text"],
              ["events", "Events"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="observatory-address">
        <span className="observatory-dot-grid" aria-hidden="true">
          ⠿
        </span>
        <a
          href={(mode === "text" ? doc?.url : frameUrl) || undefined}
          target="_blank"
          rel="noreferrer"
          title={(mode === "text" ? doc?.url : frameUrl) || ""}
        >
          {(mode === "text" ? doc?.url : frameUrl) ||
            "Waiting for the first expedition"}
        </a>
        {(doc || frameUrl) && <ArrowUpRight size={12} />}
      </div>
      <div
        className={`observatory-screen ${scout.fetching && mode === "browser" ? "is-fetching" : ""} ${patrolling && mode === "browser" ? "is-patrolling" : ""} ${motionPaused ? "is-motion-paused" : ""}`}
      >
        {mode === "browser" && (
          <>
            {colony.config.browser && scout.ant && scout.frame ? (
              <BrowserFrame
                key={scout.ant.id}
                antId={scout.ant.id}
                revision={scout.frame.id}
              />
            ) : (
              <div className="observatory-placeholder">
                <Radio size={28} />
                <h3>
                  {loaded
                    ? "The trail starts here."
                    : "Connecting to the colony."}
                </h3>
                <p>
                  {loaded
                    ? "Public source pages appear as the scout explores."
                    : "Reading saved sources and server activity…"}
                </p>
              </div>
            )}
            <div className="observatory-scrim" />
            <div className="observatory-live-badge">
              {!loaded
                ? "CONNECTING"
                : scout.fetching
                  ? "● READING NOW"
                  : scout.reasoning
                    ? "◉ CLAUDE REASONING"
                    : patrolling
                      ? "↝ PATROLLING · LAST CAPTURE"
                      : "◷ LAST CAPTURE"}
            </div>
            <div
              className={
                scout.fetching || patrolling
                  ? "ant-foraging-wanderer"
                  : "ant-foraging-resting"
              }
            >
              <AntScout />
            </div>
            <div className="observatory-capture">
              <span>{scout.ant?.name || "SCOUT"}</span>
              <span>
                {scout.frame
                  ? `CAPTURE ${stamp(scout.frame.created)}`
                  : "NO CAPTURE YET"}
              </span>
            </div>
          </>
        )}
        {mode === "text" &&
          (doc ? (
            <SavedText key={doc.id} doc={doc} />
          ) : (
            <div className="observatory-placeholder">
              <h3>No saved text yet.</h3>
              <p>The first collected page will appear here.</p>
            </div>
          ))}
        {mode === "events" && (
          <ol className="observatory-events">
            {antEvents.slice(0, 30).map((e) => (
              <li key={e.id}>
                <time>{stamp(e.created)}</time>
                <b>{e.kind}</b>
                <div>
                  <p>{e.message}</p>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noreferrer">
                      {e.url}
                    </a>
                  )}
                </div>
              </li>
            ))}
            {!antEvents.length && <li>Waiting for the first server event.</li>}
          </ol>
        )}
      </div>
      <div className="observatory-underbar">
        <span>
          {mode === "browser"
            ? "Server browser captures · not continuous video"
            : mode === "text"
              ? "Text collected by the scout"
              : "Actual server events · newest first"}
        </span>
        <div>
          <button
            disabled={!docs.length}
            aria-label="Previous saved source"
            onClick={() => previous(-1)}
          >
            <ChevronLeft size={13} />
          </button>
          <span>
            {doc ? index + 1 : 0}/{docs.length}
          </span>
          <button
            disabled={!docs.length}
            aria-label="Next saved source"
            onClick={() => previous(1)}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      <div className="observatory-trail">
        <div className="observatory-trail-heading">
          <span>❯ trail → library → Claude</span>
          <span>
            {scout.order
              ? `${collected}/${scout.order.target} sources`
              : "awaiting expedition"}
          </span>
        </div>
        {antEvents
          .filter((e) => e.kind !== "frame")
          .slice(0, 3)
          .map((e) => (
            <div className="observatory-trail-row" key={e.id}>
              <time>{stamp(e.created)}</time>
              <b>{e.kind === "reasoned" ? "→ CLAUDE" : e.kind.toUpperCase()}</b>
              <span title={e.message}>{e.message}</span>
            </div>
          ))}
        {!antEvents.length && (
          <p className="observatory-wait">
            Reads, saved sources and Claude handoffs appear here.
          </p>
        )}
      </div>
      <footer className="observatory-footer">
        <div>
          <span className="observatory-eyebrow">
            {scout.reasoning
              ? "QUEEN AT WORK"
              : pending
                ? "EXPEDITION IN PROGRESS"
                : "COLONY AUTOPILOT"}
          </span>
          <strong>{nextLabel}</strong>
          <small>
            {loaded
              ? `${colony.config.autopilotRunsToday ?? 0}/${colony.config.autopilotDailyLimit ?? 12} expeditions today`
              : "Loading activity"}
            {!canOperate ? " · operator controls" : ""}
          </small>
        </div>
        <button
          className="observatory-dispatch"
          disabled={
            !loaded ||
            busy ||
            !canOperate ||
            pending ||
            !colony.config.autopilot ||
            dailyFull
          }
          onClick={() => {
            setMode("browser");
            void forage();
          }}
        >
          {busy ? "Starting…" : "Forage now"} <ArrowUpRight size={13} />
        </button>
      </footer>
    </section>
  );
}
