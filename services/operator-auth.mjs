import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const authConfigured = (env) => (env.OPERATOR_SECRET || "").length >= 24;
const digest = (value) => createHash("sha256").update(value).digest();
export const equalSecret = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  timingSafeEqual(digest(a), digest(b));
const sign = (value, secret) =>
  createHmac("sha256", secret).update(value).digest("base64url");

export function operatorSession(request, env) {
  if (!authConfigured(env)) return false;
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("antnet_operator="))
    ?.slice(16);
  if (!cookie) return false;
  const [expires, signature] = cookie.split(".");
  if (
    !/^\d+$/.test(expires) ||
    Number(expires) < Date.now() ||
    Number(expires) > Date.now() + 8 * 3600000
  )
    return false;
  return equalSecret(signature, sign(expires, env.OPERATOR_SECRET));
}

export async function sessionEndpoint(request, env) {
  const headers = { "Cache-Control": "no-store" };
  const respond = (body, status = 200) =>
    Response.json(body, { status, headers });
  if (request.method === "GET")
    return respond({
      operator: operatorSession(request, env),
      configured: authConfigured(env),
    });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return respond({ error: "Same-origin request required." }, 403);
  if (request.method === "DELETE") {
    headers["Set-Cookie"] =
      "antnet_operator=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
    return respond({ operator: false });
  }
  if (request.method !== "POST")
    return respond({ error: "Method not allowed." }, 405);
  if (!authConfigured(env))
    return respond(
      {
        error:
          "Operator access is not configured. Add OPERATOR_SECRET (at least 24 characters) in Netlify environment variables.",
      },
      503,
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return respond({ error: "JSON required." }, 415);
  const reader = request.body?.getReader();
  if (!reader) return respond({ error: "Access key required." }, 400);
  let raw = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      raw += new TextDecoder().decode(chunk.value);
      if (raw.length > 2048) {
        await reader.cancel();
        return respond({ error: "Request too large." }, 413);
      }
    }
    const input = JSON.parse(raw);
    if (!equalSecret(input.key, env.OPERATOR_SECRET))
      return respond({ error: "Incorrect operator key." }, 401);
  } catch {
    return respond({ error: "Invalid request." }, 400);
  }
  const expires = String(Date.now() + 8 * 3600000);
  headers["Set-Cookie"] =
    `antnet_operator=${expires}.${sign(expires, env.OPERATOR_SECRET)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`;
  return respond({ operator: true });
}
