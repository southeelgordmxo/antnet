import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { browserRead } from "./browser-engine.mjs";
const token = process.env.BROWSER_SERVICE_TOKEN;
if (!token || token.length < 32)
  throw new Error(
    "Set BROWSER_SERVICE_TOKEN to a random secret of at least 32 characters.",
  );
const allowed = (
  process.env.CRAWL_ALLOWED_HOSTS ||
  "ethereum.org,solana.com,bitcoin.org,developers.uniswap.org,docs.chain.link,aave.com"
)
  .split(",")
  .map((x) => x.trim());
let active = 0;
http
  .createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const auth = Buffer.from(req.headers.authorization || "");
    const expected = Buffer.from("Bearer " + token);
    if (auth.length !== expected.length || !timingSafeEqual(auth, expected)) {
      res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    if (req.method !== "POST" || req.url !== "/render") {
      res.writeHead(404).end("{}");
      return;
    }
    if (active >= 2) {
      res.writeHead(429).end(JSON.stringify({ error: "Browser workers busy" }));
      return;
    }
    active++;
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) throw new Error("Request too large");
      }
      const { url } = JSON.parse(body);
      const result = await browserRead(url, allowed);
      res.end(
        JSON.stringify({
          ...result,
          screenshot: result.screenshot.toString("base64"),
        }),
      );
    } catch (e) {
      res.writeHead(422).end(JSON.stringify({ error: e.message }));
    } finally {
      active--;
    }
  })
  .listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
    console.log("AntNet browser rendering service ready"),
  );
