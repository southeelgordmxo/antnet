"use client";
import { useEffect, useRef } from "react";
import {
  advanceAnt,
  antLegPose,
  createAntMotion,
  type AntMotion,
} from "../../../lib/ant-locomotion";
import { AntScout } from "./ant-scout";

/** A visual companion to server activity. Walking never starts a network job. */
export function CrawlingAnt({
  moving = true,
  paused = false,
  fetching = false,
  seed = "scout",
}: {
  moving?: boolean;
  paused?: boolean;
  fetching?: boolean;
  seed?: string;
}) {
  const surface = useRef<SVGSVGElement>(null);
  const model = useRef<AntMotion | null>(null);
  const identity = useRef("");
  const activity = useRef(fetching);
  useEffect(() => {
    activity.current = fetching;
  }, [fetching]);
  useEffect(() => {
    const svg = surface.current;
    if (!svg) return;
    const body = svg.querySelector<SVGGElement>(".ant-crawl-body")!;
    const legs = Array.from(
      svg.querySelectorAll<SVGGElement>(".ant-crawl-leg"),
    );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let width = svg.clientWidth,
      height = svg.clientHeight;
    let frame = 0,
      last = 0,
      visible = true;
    if (!model.current || identity.current !== seed) {
      model.current = createAntMotion(
        width,
        height,
        Array.from(seed).reduce((n, c) => n * 31 + c.charCodeAt(0), 17) >>> 0,
      );
      identity.current = seed;
    }
    const state = model.current;
    const draw = () => {
      body.setAttribute(
        "transform",
        `translate(${state.position.x} ${state.position.y}) rotate(${(state.heading * 180) / Math.PI + 90})`,
      );
      legs.forEach((group, i) => {
        const { hip, knee, foot, lift } = antLegPose(state, state.legs[i]);
        const d = `M${hip.x},${hip.y} L${knee.x},${knee.y - lift * 4} L${foot.x},${foot.y - lift * 5}`;
        group
          .querySelectorAll("path")
          .forEach((path) => path.setAttribute("d", d));
        const joint = group.querySelector("circle")!;
        joint.setAttribute("cx", String(knee.x));
        joint.setAttribute("cy", String(knee.y - lift * 4));
      });
    };
    const allowed = () =>
      moving &&
      !paused &&
      !reduced.matches &&
      !document.hidden &&
      visible &&
      width > 0 &&
      height > 0;
    const tick = (now: number) => {
      frame = 0;
      if (!allowed()) return;
      if (last)
        advanceAnt(
          state,
          width,
          height,
          (now - last) / 1000,
          activity.current ? 64 : 43,
        );
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (allowed()) frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(() => {
      const nextWidth = svg.clientWidth,
        nextHeight = svg.clientHeight;
      if (width && height && (width !== nextWidth || height !== nextHeight)) {
        const dx = (state.position.x * nextWidth) / width - state.position.x;
        const dy = (state.position.y * nextHeight) / height - state.position.y;
        state.position.x += dx;
        state.position.y += dy;
        state.legs.forEach((leg) =>
          [leg.foot, leg.from, leg.to].forEach((p) => {
            p.x += dx;
            p.y += dy;
          }),
        );
      }
      width = nextWidth;
      height = nextHeight;
      draw();
      resume();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    resize.observe(svg);
    intersection.observe(svg);
    reduced.addEventListener("change", resume);
    document.addEventListener("visibilitychange", resume);
    draw();
    resume();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      reduced.removeEventListener("change", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [moving, paused, seed]);
  return (
    <svg
      ref={surface}
      className={`ant-crawl-surface ${moving && !paused ? "is-walking" : ""}`}
      aria-hidden="true"
    >
      <g className="ant-crawl-limbs">
        {Array.from({ length: 6 }, (_, i) => (
          <g className="ant-crawl-leg" key={i}>
            <path className="ant-crawl-leg-outline" />
            <path className="ant-crawl-leg-shine" />
            <circle r="2.2" />
          </g>
        ))}
      </g>
      <g className="ant-crawl-body">
        <svg x="-60" y="-71.25" width="120" height="142.5">
          <AntScout />
        </svg>
      </g>
    </svg>
  );
}
