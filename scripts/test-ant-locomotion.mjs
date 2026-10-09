import assert from "node:assert/strict";
import { advanceAnt, antBounds, antLegPose, createAntMotion } from "../src/lib/ant-locomotion.ts";

for (const [width, height] of [[360, 300], [640, 390], [1400, 800]]) {
  const ant = createAntMotion(width, height, 49);
  const bounds = antBounds(width, height);
  let plantedFrames = 0;
  const visited = new Set();
  for (let frame = 0; frame < 60 * 120; frame++) {
    const before = structuredClone(ant);
    advanceAnt(ant, width, height, 1 / 60, 64);
    assert(ant.position.x >= bounds.left && ant.position.x <= bounds.right);
    assert(ant.position.y >= bounds.top && ant.position.y <= bounds.bottom);
    assert(Math.hypot(ant.position.x - before.position.x, ant.position.y - before.position.y) <= 64 / 60 + 0.001);
    assert(Math.abs(ant.heading - before.heading) <= 2.1 / 60 + 0.001);
    visited.add(`${Math.floor(ant.position.x / 40)},${Math.floor(ant.position.y / 40)}`);
    ant.legs.forEach((leg, i) => {
      const pose = antLegPose(ant, leg);
      for (const p of [pose.hip, pose.knee, pose.foot]) assert(Number.isFinite(p.x) && Number.isFinite(p.y));
      if (leg.swing < 0 && before.legs[i].swing < 0) {
        assert.deepEqual(leg.foot, before.legs[i].foot, "Planted feet must not slide with the body");
        plantedFrames++;
      }
    });
  }
  assert(plantedFrames > 1000, "Feet must spend time planted");
  assert(visited.size > 6, "Scout must explore different parts of the panel");
}
console.log("PASS: six-legged gait, planted feet, bounded steering and exploration at mobile/desktop sizes");
