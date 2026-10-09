import { chromium } from "playwright";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { compactRenderedHtml } from "./rendered-html.mjs";
let browserPromise;
const forbidden = (ip) =>
  ip === "::1" ||
  ip === "::" ||
  ip.startsWith("fc") ||
  ip.startsWith("fd") ||
  ip.startsWith("fe80:") ||
  ip.startsWith("::ffff:") ||
  /^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])|198\.(18|19)|224|240)\./.test(
    ip,
  );
export async function browserRead(url, allowedHosts, options = {}) {
  const target = new URL(url);
  if (
    target.protocol !== "https:" ||
    target.username ||
    target.password ||
    !allowedHosts.includes(target.hostname) ||
    isIP(target.hostname)
  )
    throw new Error("Browser source is outside the approved hosts.");
  const addresses = await lookup(target.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => forbidden(a.address)))
    throw new Error("Private network destinations are blocked.");
  browserPromise ||= chromium.launch({ headless: true, ...options.launch });
  const browser = await browserPromise;
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "AntNetBot/1.0",
    acceptDownloads: false,
    serviceWorkers: "block",
    permissions: [],
  });
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    void context.close().catch(() => {});
  }, 90000);
  try {
    await context.route("**/*", async (route) => {
      const request = route.request();
      let u;
      try {
        u = new URL(request.url());
      } catch {
        return route.abort();
      }
      if (
        u.protocol !== "https:" ||
        u.username ||
        u.password ||
        !allowedHosts.includes(u.hostname) ||
        (u.port && u.port !== "443") ||
        (request.isNavigationRequest() &&
          (u.origin !== target.origin ||
            options.allowNavigation?.(u.href) === false)) ||
        !["GET", "HEAD"].includes(request.method())
      )
        return route.abort();
      if (["media", "websocket"].includes(request.resourceType()))
        return route.abort();
      try {
        const resolved = await lookup(u.hostname, { all: true });
        if (!resolved.length || resolved.some((a) => forbidden(a.address)))
          return route.abort();
      } catch {
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const response = await page.goto(target.href, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    if (!response?.ok())
      throw new Error(
        `Browser source returned HTTP ${response?.status() || "unavailable"}.`,
      );
    if (
      /\b(noindex|noai|none)\b/i.test(response.headers()["x-robots-tag"] || "")
    )
      throw new Error(
        "This source requests exclusion from indexing or AI use.",
      );
    await page.waitForTimeout(1500);
    const final = new URL(page.url());
    if (final.origin !== target.origin)
      throw new Error("Cross-origin redirect rejected.");
    let screenshot;
    const capture = async () => {
      try {
        return await page.screenshot({
          type: "jpeg",
          quality: 55,
          timeout: 10000,
          animations: "disabled",
        });
      } catch {
        // A font or animation must not prevent the article being collected.
        return undefined;
      }
    };
    if (options.onFrame) {
      for (let step = 0; step < 3; step++) {
        if (step) {
          await page.mouse.wheel(0, 450);
          await page.waitForTimeout(1200);
        }
        const frame = await capture();
        if (frame) {
          screenshot = frame;
          await options.onFrame(frame, page.url());
        }
      }
    }
    const text = compactRenderedHtml(await page.content());
    if (!options.onFrame) screenshot = await capture();
    return { url: page.url(), text, screenshot };
  } catch (error) {
    if (timedOut)
      throw new Error("Browser page exceeded its 90-second deadline.");
    throw error;
  } finally {
    clearTimeout(deadline);
    await context.close();
  }
}
export async function closeBrowser() {
  const running = browserPromise;
  browserPromise = undefined;
  if (running) await (await running).close();
}
