import { getDatabase } from "@netlify/database";
import { getStore } from "@netlify/blobs";
import { postgresAdapter } from "./postgres-adapter.mjs";
import { seedAutopilot } from "../worker/autopilot.js";

export function netlifyEnvironment() {
  const env = { ...process.env, DB: postgresAdapter(getDatabase().pool) };
  // Netlify may inject an AI gateway key automatically. Only use the owner's
  // explicitly configured Anthropic connection, never advertise that default
  // gateway credential as a verified direct Anthropic key.
  if (env.ANTNET_CLAUDE_ENABLED !== "true") delete env.ANTHROPIC_API_KEY;
  const frames = getStore({ name: "antnet-frames", consistency: "strong" });
  env.SAVE_FRAME = (ant, bytes) => frames.set(`${ant}.jpg`, bytes);
  env.FRAMES = async (ant) => {
    if (!/^[a-z0-9-]{36}$/.test(ant))
      return new Response("Not found", { status: 404 });
    const frame = await frames.get(`${ant}.jpg`, { type: "arrayBuffer" });
    return frame
      ? new Response(frame, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "no-store",
          },
        })
      : new Response("No frame yet", { status: 404 });
  };
  return env;
}

export async function launchRunner(origin, secret, cookie = "") {
  const env = netlifyEnvironment();
  await seedAutopilot(env);
  const pending = await env.DB.prepare(
    "SELECT o.id FROM orders o JOIN ants a ON a.id=o.ant_id WHERE o.status IN ('queued','reading') AND a.paused=0 AND (o.lease IS NULL OR o.lease<?) LIMIT 1",
  )
    .bind(new Date(Date.now() - 180000).toISOString())
    .first();
  if (!pending) return;
  const response = await fetch(
    new URL("/.netlify/functions/colony-background", origin),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok)
    throw new Error("The colony runner could not start. Please retry.");
}
