import worker from "../../worker/index.js";
import {
  netlifyEnvironment,
  launchRunner,
} from "../../services/netlify-runtime.mjs";
import {
  authConfigured,
  operatorSession,
  sessionEndpoint,
} from "../../services/operator-auth.mjs";

export default async function handler(request) {
  const path = new URL(request.url).pathname;
  if (path === "/api/session") return sessionEndpoint(request, process.env);
  const operator = operatorSession(request, process.env);
  if (!["GET", "HEAD"].includes(request.method) && !operator)
    return Response.json(
      {
        error: authConfigured(process.env)
          ? "Sign in as the colony operator to make changes."
          : "The colony is in view-only mode until operator access is configured.",
      },
      { status: 401 },
    );
  if (
    request.method === "POST" &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return Response.json(
      { error: "Same-origin request required." },
      { status: 403 },
    );
  try {
    if (path === "/api/tick" && request.method === "POST") {
      await launchRunner(
        process.env.URL || new URL(request.url).origin,
        process.env.OPERATOR_SECRET,
        request.headers.get("cookie") || "",
      );
      return Response.json({ queued: true });
    }
    const response = await worker.fetch(request, netlifyEnvironment());
    if (
      ["/api/crawl", "/api/forage", "/api/autopilot"].includes(path) &&
      response.ok
    ) {
      try {
        await launchRunner(
          process.env.URL || new URL(request.url).origin,
          process.env.OPERATOR_SECRET,
          request.headers.get("cookie") || "",
        );
      } catch (error) {
        // The queued job is already durable. The scheduled dispatcher retries.
        console.error("Immediate dispatch deferred:", error.message);
      }
    }
    if (path === "/api/state" && response.ok) {
      const state = await response.json();
      state.config.operatorRequired = true;
      state.config.operator = operator;
      state.config.continuous = process.env.PUBLIC_COLONY === "true";
      return Response.json(state, { headers: { "Cache-Control": "no-store" } });
    }
    return response;
  } catch (error) {
    console.error("Netlify colony:", error.message);
    return Response.json(
      {
        error:
          "The colony database is not ready. Check Netlify Database and the latest deployment logs.",
      },
      { status: 503 },
    );
  }
}
export const config = { path: "/api/*" };
