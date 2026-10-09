import worker from "../../worker/index.js";
import {
  netlifyEnvironment,
  launchRunner,
} from "../../services/netlify-runtime.mjs";
import { authConfigured, equalSecret } from "../../services/operator-auth.mjs";
import {
  attachNetlifyBrowser,
  closeBrowser,
} from "../../services/netlify-browser.mjs";

export default async function handler(request) {
  if (
    !authConfigured(process.env) ||
    !equalSecret(
      request.headers.get("authorization"),
      `Bearer ${process.env.OPERATOR_SECRET}`,
    )
  )
    return;
  const env = netlifyEnvironment();
  attachNetlifyBrowser(env);
  // One page per invocation bounds Chromium memory and closes the process
  // between sources. Continue the trail immediately; cron remains a fallback.
  // Each page gets a DB lease so overlapping dispatchers cannot claim it twice.
  let continueTrail = false;
  try {
    const response = await worker.fetch(
      new Request("https://antnet.internal/api/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
      env,
    );
    if (!response.ok)
      throw new Error("Colony step failed; its lease will be retried.");
    const result = await response.json();
    continueTrail = result.status === "queued";
    console.log(
      JSON.stringify({
        order: result.id,
        status: result.status,
        pages: result.pages,
        idle: result.idle,
      }),
    );
  } finally {
    await closeBrowser();
  }
  if (continueTrail && process.env.URL) {
    try {
      await launchRunner(process.env.URL, process.env.OPERATOR_SECRET);
    } catch {
      console.warn("Next page is safely queued for the scheduled dispatcher.");
    }
  }
}
