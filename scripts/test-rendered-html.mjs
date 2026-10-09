import assert from "node:assert/strict";
import { load } from "cheerio";
import { compactRenderedHtml } from "../services/rendered-html.mjs";
const html = `<html><head><title>Solana research</title><meta name="robots" content="noai"><script>${"x".repeat(700000)}</script></head><body><!--internal state--><nav>Menu</nav><main role="main" id="content"><h1>Transactions</h1><p>Article preserved.</p><a href="/docs/core">Learn more</a><div aria-hidden="true">Decoration</div><img src="data:image/png;base64,${"a".repeat(200000)}" alt="Diagram"></main></body></html>`;
const text = compactRenderedHtml(html);
const $ = load(text);
assert.ok(Buffer.byteLength(text) < 2000);
assert.equal($("title").text(), "Solana research");
assert.equal($('meta[name="robots"]').attr("content"), "noai");
assert.equal($("main p").text(), "Article preserved.");
assert.equal($("main a").attr("href"), "/docs/core");
assert.equal($("[aria-hidden=true]").text(), "Decoration");
assert.equal($("script").length, 0);
assert.equal(text.includes("internal state"), false);
assert.throws(
  () => compactRenderedHtml("x".repeat(8000001)),
  /collection limit/,
);
assert.throws(
  () => compactRenderedHtml(`<main>${"x".repeat(650001)}</main>`),
  /article exceeds/,
);
console.log(
  "PASS: rendered extraction removes oversized application payloads, preserves article/link/exclusion metadata, and enforces size limits.",
);
