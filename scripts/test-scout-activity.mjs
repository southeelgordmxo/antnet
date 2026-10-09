import assert from "node:assert/strict";
import { scoutActivity } from "../src/lib/scout-activity.ts";
const now = Date.now();
const at = (age) => new Date(now - age).toISOString();
const colony = {
  ants: [
    { id: "one", paused: 0 },
    { id: "two", paused: 0 },
  ],
  orders: [
    {
      id: "new",
      ant_id: "two",
      status: "reading",
      url: "https://ethereum.org/new",
    },
    { id: "old", ant_id: "two", status: "complete" },
  ],
  events: [
    {
      id: "late-old",
      ant_id: "two",
      order_id: "old",
      kind: "reasoned",
      created: at(0),
    },
    {
      id: "frame",
      ant_id: "two",
      order_id: "new",
      kind: "frame",
      created: at(1000),
      url: "https://ethereum.org/new",
    },
    {
      id: "read",
      ant_id: "two",
      order_id: "new",
      kind: "reading",
      created: at(5000),
    },
  ],
  documents: [],
};
assert.equal(scoutActivity(colony, now).ant.id, "two");
assert.equal(
  scoutActivity(colony, now).fetching,
  true,
  "Late events from another order must not hide active fetching",
);
assert.equal(scoutActivity(colony, now).frame.id, "frame");
assert.equal(
  scoutActivity(colony, now + 180000).fetching,
  false,
  "Expired read cannot animate indefinitely",
);
assert.equal(scoutActivity(colony, 0).fetching, false);
assert.equal(scoutActivity(colony, now, "one").fetching, false);
colony.events.unshift({
  id: "reason",
  ant_id: "two",
  order_id: "new",
  kind: "reasoning",
  created: at(0),
});
assert.equal(scoutActivity(colony, now).phase, "CLAUDE REASONING");
assert.equal(scoutActivity(colony, now).fetching, false);
colony.orders[0].status = "queued";
assert.equal(scoutActivity(colony, now).phase, "QUEUED FOR NEXT PAGE");
colony.ants[1].paused = 1;
assert.equal(scoutActivity(colony, now).phase, "PAUSED");
colony.ants[1].paused = 0;
colony.orders[0].status = "complete";
assert.equal(scoutActivity(colony, now).phase, "BETWEEN EXPEDITIONS");
console.log(
  "PASS: active ant selection, order-scoped events, fresh reads, expired leases, queue, reasoning, pause and completion states.",
);
