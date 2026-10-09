/** Original six-legged locomotion: planted feet, alternating tripods and two-bone knees. */
export type Point = { x: number; y: number };
export type AntLeg = {
  side: number;
  row: number;
  foot: Point;
  from: Point;
  to: Point;
  swing: number;
};
export type AntMotion = {
  position: Point;
  heading: number;
  target: Point;
  time: number;
  stride: number;
  random: number;
  legs: AntLeg[];
};
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const angleDelta = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
function random(state: AntMotion) {
  state.random = (Math.imul(state.random, 1664525) + 1013904223) >>> 0;
  return state.random / 4294967296;
}
export function antWorld(
  state: AntMotion,
  forward: number,
  side: number,
): Point {
  return {
    x:
      state.position.x +
      Math.cos(state.heading) * forward -
      Math.sin(state.heading) * side,
    y:
      state.position.y +
      Math.sin(state.heading) * forward +
      Math.cos(state.heading) * side,
  };
}
export function antBounds(width: number, height: number) {
  const x = Math.min(82, width / 2);
  const y = Math.min(84, height / 2);
  return {
    left: x,
    right: Math.max(x, width - x),
    top: y,
    bottom: Math.max(y, height - y),
  };
}
export function createAntMotion(
  width: number,
  height: number,
  seed = 17,
): AntMotion {
  const state: AntMotion = {
    position: { x: width * 0.5, y: height * 0.5 },
    heading: -0.35,
    target: { x: width * 0.72, y: height * 0.35 },
    time: 0,
    stride: 0,
    random: seed,
    legs: [],
  };
  for (let row = 0; row < 3; row++)
    for (const side of [-1, 1]) {
      const foot = antWorld(
        state,
        [35, -2, -37][row],
        side * [43, 52, 41][row],
      );
      state.legs.push({
        side,
        row,
        foot,
        from: { ...foot },
        to: { ...foot },
        swing: -1,
      });
    }
  return state;
}
export function advanceAnt(
  state: AntMotion,
  width: number,
  height: number,
  seconds: number,
  speed: number,
) {
  const dt = clamp(seconds, 0, 0.04);
  const bounds = antBounds(width, height);
  state.time += dt;
  state.target.x = clamp(state.target.x, bounds.left, bounds.right);
  state.target.y = clamp(state.target.y, bounds.top, bounds.bottom);
  if (distance(state.position, state.target) < 34) {
    state.target = {
      x: bounds.left + random(state) * (bounds.right - bounds.left),
      y: bounds.top + random(state) * (bounds.bottom - bounds.top),
    };
  }
  const desired = Math.atan2(
    state.target.y - state.position.y,
    state.target.x - state.position.x,
  );
  const turn = angleDelta(desired - state.heading);
  state.heading += clamp(turn, -2.1 * dt, 2.1 * dt);
  // Slow into a turn so the body leads the feet instead of sliding sideways.
  const velocity = speed * (0.24 + 0.76 * Math.max(0, Math.cos(turn)));
  const previous = { ...state.position };
  state.position.x = clamp(
    state.position.x + Math.cos(state.heading) * velocity * dt,
    bounds.left,
    bounds.right,
  );
  state.position.y = clamp(
    state.position.y + Math.sin(state.heading) * velocity * dt,
    bounds.top,
    bounds.bottom,
  );
  const travelled = distance(previous, state.position);
  state.stride += travelled / 29 + Math.abs(turn) * dt * 0.24;
  for (const leg of state.legs) {
    const phase =
      (state.stride + ((leg.row + (leg.side > 0 ? 1 : 0)) % 2) * 0.5) % 1;
    const nominal = antWorld(
      state,
      [35, -2, -37][leg.row] + velocity * 0.18,
      leg.side * [43, 52, 41][leg.row],
    );
    if (
      leg.swing < 0 &&
      ((phase < 0.42 && distance(leg.foot, nominal) > 10) ||
        distance(leg.foot, nominal) > 42)
    ) {
      leg.from = { ...leg.foot };
      leg.to = nominal;
      leg.swing = 0;
    }
    if (leg.swing >= 0) {
      leg.swing = Math.min(1, leg.swing + dt / 0.22);
      const t = leg.swing * leg.swing * (3 - 2 * leg.swing);
      leg.foot = {
        x: leg.from.x + (leg.to.x - leg.from.x) * t,
        y: leg.from.y + (leg.to.y - leg.from.y) * t,
      };
      if (leg.swing === 1) leg.swing = -1;
    }
  }
}
export function antLegPose(state: AntMotion, leg: AntLeg) {
  const hip = antWorld(
    state,
    [10.5, 0.75, -8.25][leg.row],
    leg.side * [7.5, 9.75, 7.5][leg.row],
  );
  const dx = leg.foot.x - hip.x;
  const dy = leg.foot.y - hip.y;
  const length = Math.max(0.001, Math.hypot(dx, dy));
  const reach = Math.min(length, 70);
  const along = (36 * 36 - 38 * 38 + reach * reach) / (2 * reach);
  const bend = Math.sqrt(Math.max(0, 36 * 36 - along * along));
  const knee = {
    x: hip.x + (dx / length) * along - (dy / length) * bend * leg.side,
    y: hip.y + (dy / length) * along + (dx / length) * bend * leg.side,
  };
  return {
    hip,
    knee,
    foot: leg.foot,
    lift: leg.swing < 0 ? 0 : Math.sin(leg.swing * Math.PI),
  };
}
