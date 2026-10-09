import type { Colony } from "../components/sites/antnet/antnet";

/** Derive both observatories from the same real server events. */
export function scoutActivity(colony: Colony, now: number, antId = "") {
  const events = [...(colony.events || [])].sort((a, b) =>
    b.created.localeCompare(a.created),
  );
  const pending = colony.orders.find(
    (o) =>
      ["reading", "queued"].includes(o.status) &&
      (!antId || o.ant_id === antId),
  );
  const ant =
    colony.ants.find((a) => a.id === (antId || pending?.ant_id)) ||
    colony.ants[0];
  const antEvents = events.filter((e) => e.ant_id === ant?.id);
  const order = pending || colony.orders.find((o) => o.ant_id === ant?.id);
  const latest = antEvents.find((e) => e.order_id === order?.id);
  const reading = antEvents.find(
    (e) => e.order_id === order?.id && e.kind === "reading",
  );
  const fresh =
    now > 0 &&
    reading &&
    now - Date.parse(reading.created) >= 0 &&
    now - Date.parse(reading.created) < 180000;
  const fetching = Boolean(
    !ant?.paused &&
    order?.status === "reading" &&
    fresh &&
    ["reading", "frame"].includes(latest?.kind || ""),
  );
  const reasoning = Boolean(
    !ant?.paused &&
    order?.status === "reading" &&
    fresh &&
    latest?.kind === "reasoning",
  );
  const frame = antEvents.find((e) => e.kind === "frame");
  const document =
    colony.documents.find((d) => d.url === latest?.url) ||
    colony.documents.find((d) => d.ant_id === ant?.id);
  const phase = ant?.paused
    ? "PAUSED"
    : fetching
      ? "FETCHING SOURCE"
      : reasoning
        ? "CLAUDE REASONING"
        : order?.status === "queued"
          ? "QUEUED FOR NEXT PAGE"
          : order?.status === "reading"
            ? "RECONNECTING SCOUT"
            : "BETWEEN EXPEDITIONS";
  return {
    ant,
    order,
    latest,
    frame,
    document,
    fetching,
    reasoning,
    phase,
    events,
    currentUrl: latest?.url || order?.url || document?.url || "",
  };
}
