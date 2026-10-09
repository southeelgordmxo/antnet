import assert from "node:assert/strict";
import {
  sessionEndpoint,
  operatorSession,
} from "../services/operator-auth.mjs";
import { postgresQuery } from "../services/postgres-adapter.mjs";
const env = { OPERATOR_SECRET: "fixture-operator-secret-32-characters" };
const req = (method, body, origin = "https://antnet.test", cookie = "") =>
  new Request("https://antnet.test/api/session", {
    method,
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
assert.equal(
  (
    await sessionEndpoint(
      req("POST", { key: env.OPERATOR_SECRET }, "https://evil.test"),
      env,
    )
  ).status,
  403,
);
assert.equal(
  (await sessionEndpoint(req("POST", { key: "wrong" }), env)).status,
  401,
);
assert.equal(
  (await sessionEndpoint(req("POST", { key: env.OPERATOR_SECRET }), {})).status,
  503,
);
const response = await sessionEndpoint(
  req("POST", { key: env.OPERATOR_SECRET }),
  env,
);
assert.equal(response.status, 200);
const cookie = response.headers.get("set-cookie");
assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
assert.equal(operatorSession(req("GET", null, undefined, cookie), env), true);
assert.equal(
  operatorSession(
    req("GET", null, undefined, cookie.replace(/=\d/, "=0")),
    env,
  ),
  false,
);
assert.equal(
  operatorSession(req("GET", null, undefined, cookie), {
    OPERATOR_SECRET: "rotated-operator-secret-32-characters",
  }),
  false,
);
assert.equal(
  postgresQuery("SELECT '?' AS mark WHERE title LIKE ? AND id=?"),
  "SELECT '?' AS mark WHERE title ILIKE $1 AND id=$2",
);
console.log(
  "PASS: operator login, signed secure sessions, CSRF guard, tamper rejection, secret rotation, parameter conversion.",
);
process.env.TEST_POSTGRES = "true";
await import("./test-pipeline.mjs");
