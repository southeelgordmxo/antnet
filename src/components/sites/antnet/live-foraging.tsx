"use client";
/* Native images and links are shared with the portable React build. */
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */
import { useState } from "react";
import { ArrowUpRight, Pause, Play, Radio, RefreshCw } from "lucide-react";
import type { Colony } from "./antnet";
import { readApiResponse } from "../../../lib/api-response";
import "./live-foraging.css";
import { AntScout } from "./ant-scout";
import { useScoutActivity } from "./use-scout-activity";

type ForagingColony = Colony & {
  config: Colony["config"] & {
    autopilot?: boolean;
    autopilotIntervalMinutes?: number;
    autopilotDailyLimit?: number;
    autopilotNextRun?: string;
    autopilotRunsToday?: number;
  };
};
type Props = {
  colony: ForagingColony;
  refresh: () => Promise<Colony | null>;
  notify: (message: string) => void;
};
function host(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "source pending";
  }
}
function stamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString("en-GB", { hour12: false });
}
export function BrowserFrame({
  antId,
  revision,
}: {
  antId: string;
  revision: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [failed, setFailed] = useState("");
  const source = `/api/frame?ant=${encodeURIComponent(antId)}&v=${encodeURIComponent(revision)}`;
  return (
    <div className="ant-foraging-frame">
      {!displayed && (
        <div className="ant-foraging-frame-status" role="status">
          {failed === source
            ? "No browser screenshot is available for this ant yet."
            : "Loading last browser screenshot…"}
        </div>
      )}
      {displayed && (
        <img
          src={displayed}
          alt="Last screenshot captured by this ant’s server browser"
          className="ant-foraging-frame-image"
        />
      )}
      {displayed !== source && failed !== source && (
        <img
          src={source}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(source)}
          onLoad={() => setDisplayed(source)}
          className="ant-foraging-frame-preload"
        />
      )}
    </div>
  );
}
export function LiveForagingPanel({ colony, refresh, notify }: Props) {
  const [busy, setBusy] = useState(false);
  const [selectedAnt, setSelectedAnt] = useState("");
  const {
    ant,
    order,
    fetching,
    phase,
    events,
    frame: lastCaptureEvent,
    document: latestDocument,
    currentUrl,
  } = useScoutActivity(colony, selectedAnt);
  const queued = colony.orders.filter(
    (item) => item.status === "queued",
  ).length;
  const revision = lastCaptureEvent?.id || "first";
  const previewUrl =
    colony.config.browser && lastCaptureEvent
      ? lastCaptureEvent.url
      : currentUrl;
  const canOperate =
    !colony.config.operatorRequired || Boolean(colony.config.operator);
  async function toggleAutopilot() {
    setBusy(true);
    try {
      const response = await fetch("/api/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !colony.config.autopilot }),
      });
      await readApiResponse(response);
      const updated = await refresh();
      notify(
        updated
          ? "Colony autopilot updated."
          : "Autopilot updated; refresh to check its status.",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not update autopilot.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ant-foraging" aria-labelledby="ant-foraging-heading">
      <header className="ant-foraging-header">
        <div>
          <span className="ant-foraging-eyebrow">
            FIELD OBSERVATORY / SERVER ACTIVITY
          </span>
          <h2 id="ant-foraging-heading">Follow the trail.</h2>
        </div>
        <div className="ant-foraging-controls">
          <span
            className={
              fetching ? "ant-foraging-status is-active" : "ant-foraging-status"
            }
          >
            <Radio size={13} /> {phase}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Refresh colony activity"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>
      <div className="ant-foraging-grid">
        <div className="ant-foraging-browser">
          <div className="ant-foraging-browserbar">
            <span className="ant-foraging-browserdots" aria-hidden="true">
              ● ● ●
            </span>
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer">
                {previewUrl}
                <ArrowUpRight size={13} />
              </a>
            ) : (
              <span>Waiting for the first source</span>
            )}
          </div>
          <div
            className={
              fetching
                ? "ant-foraging-viewport is-fetching"
                : "ant-foraging-viewport"
            }
          >
            {colony.config.browser && ant ? (
              <BrowserFrame key={ant.id} antId={ant.id} revision={revision} />
            ) : (
              <div className="ant-foraging-source">
                <span className="ant-foraging-eyebrow">
                  {latestDocument
                    ? "COLLECTED SOURCE EXCERPT"
                    : "SOURCE COLLECTION"}
                </span>
                <h3>
                  {latestDocument?.title ||
                    (fetching
                      ? `Reading ${host(currentUrl)}`
                      : "A quiet moment in the colony.")}
                </h3>
                <p>
                  {latestDocument?.excerpt ||
                    (fetching
                      ? "The server is fetching this page, checking access rules, and extracting research material."
                      : "Dispatch an expedition or enable autopilot to begin collecting crypto research.")}
                </p>
                {latestDocument && (
                  <a href={latestDocument.url} target="_blank" rel="noreferrer">
                    {host(latestDocument.url)} <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            )}
            {fetching && (
              <div className="ant-foraging-wanderer">
                <AntScout />
              </div>
            )}
            {!fetching && (
              <div className="ant-foraging-resting" aria-hidden="true">
                <AntScout />
              </div>
            )}
          </div>
          <div className="ant-foraging-caption">
            <span>
              {colony.config.browser
                ? `Last server browser screenshot${lastCaptureEvent ? ` · ${stamp(lastCaptureEvent.created)}` : ""} · not continuous video`
                : "Extracted source view · browser screenshots not connected"}
            </span>
            <span>
              Animated scout · follows fetch activity, not cursor position.
            </span>
          </div>
          <div className="ant-foraging-assignment">
            <label>
              observer
              <select
                value={ant?.id || ""}
                onChange={(event) => setSelectedAnt(event.target.value)}
                disabled={!colony.ants.length}
              >
                {!colony.ants.length && <option value="">no ants yet</option>}
                {colony.ants.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                    {item.paused ? " · paused" : ""}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {ant?.paused
                ? "Ant paused"
                : fetching
                  ? "Reading now"
                  : order
                    ? `Expedition ${order.status}`
                    : "No assigned expedition"}
            </span>
            {order && (
              <span>
                {order.pages}/{order.target} pages · {order.reads} reads
              </span>
            )}
          </div>
        </div>
        <aside className="ant-foraging-side">
          <div className="ant-foraging-autopilot">
            <div>
              <span className="ant-foraging-eyebrow">COLONY AUTOPILOT</span>
              <strong>
                {colony.config.autopilot
                  ? "Exploring on schedule"
                  : "Waiting for dispatch"}
              </strong>
            </div>
            <button
              type="button"
              disabled={!canOperate || busy}
              onClick={() => void toggleAutopilot()}
              title={
                canOperate
                  ? undefined
                  : "Sign in as the colony operator to control autopilot"
              }
            >
              {colony.config.autopilot ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
              {busy ? "Saving…" : colony.config.autopilot ? "Pause" : "Enable"}
            </button>
            <p>
              {colony.config.autopilotIntervalMinutes
                ? `Checks every ${colony.config.autopilotIntervalMinutes} minutes. `
                : "Scheduled source collection. "}
              {colony.config.autopilotDailyLimit
                ? `Up to ${colony.config.autopilotDailyLimit} expeditions per day. `
                : ""}
              {queued} queued.
            </p>
            {colony.config.autopilot && (
              <p>
                {typeof colony.config.autopilotRunsToday === "number"
                  ? `${colony.config.autopilotRunsToday} expeditions today. `
                  : ""}
                {colony.config.autopilotRunsToday !== undefined &&
                colony.config.autopilotDailyLimit !== undefined &&
                colony.config.autopilotRunsToday >=
                  colony.config.autopilotDailyLimit
                  ? "Daily limit reached. Resumes on the next UTC day."
                  : colony.config.autopilotNextRun
                    ? `Next check ${stamp(colony.config.autopilotNextRun)}.`
                    : ""}
              </p>
            )}
            {!canOperate && (
              <small>Operator sign-in required for controls.</small>
            )}
          </div>
          <div className="ant-foraging-handoff">
            <span className="ant-foraging-eyebrow">
              ANT → SOURCE LIBRARY → CLAUDE
            </span>
            <strong>
              {colony.config.claudeStatus === "needs_credits"
                ? "Claude needs API credits"
                : colony.config.claudeStatus === "ready"
                  ? "Claude research connected"
                  : colony.config.claude
                    ? "Claude key configured"
                    : "Sources retained · Claude pending"}
            </strong>
            <p>
              {colony.config.claudeError ||
                (colony.config.claude
                  ? "Collected text becomes source context for Claude’s cited research answers."
                  : "The colony can save sources while the Claude connection is being configured.")}
            </p>
            <a href="/queen/">
              Open research desk <ArrowUpRight size={13} />
            </a>
            <a className="ant-foraging-harvest-link" href="/treasury/">
              Explore Colony Harvest <ArrowUpRight size={13} />
            </a>
          </div>
          <div className="ant-foraging-stream">
            <h3>
              colony activity{" "}
              <span>{events.length ? "LATEST EVENTS" : "NO EVENTS YET"}</span>
            </h3>
            <ol aria-label="Recent server crawl events">
              {events.slice(0, 8).map((event) => (
                <li key={event.id}>
                  <div>
                    <time dateTime={event.created}>{stamp(event.created)}</time>
                    <span
                      className={`ant-foraging-event-kind kind-${["reading", "saved", "refreshed", "skipped"].includes(event.kind) ? event.kind : "other"}`}
                    >
                      {event.kind}
                    </span>
                  </div>
                  <p>{event.message}</p>
                  {event.url && (
                    <a href={event.url} target="_blank" rel="noreferrer">
                      {host(event.url)} <ArrowUpRight size={11} />
                    </a>
                  )}
                </li>
              ))}
            </ol>
            {!events.length && (
              <p className="ant-foraging-empty">
                Actual fetches, saved pages, and crawl errors appear here as the
                server reports them.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
