import assert from "node:assert/strict";
import { readPdf } from "../worker/pdf.js";
import { pdfFixture } from "./fixtures/pdf.mjs";

const url = "https://ethereum.org/paper.pdf";
const text =
  "Ethereum validators secure a decentralized blockchain. Smart contracts execute transactions. The protocol uses consensus to maintain its shared state.";
const result = await readPdf(pdfFixture(text, 2), url);
assert.match(result.content, /Ethereum validators/);
assert.match(result.content, /\[PDF page 2\]/);
assert.equal(result.title, "paper.pdf");
assert.equal(result.url, url);
await assert.rejects(() => readPdf(pdfFixture(text, 41), url), /40-page/);
await assert.rejects(() => readPdf(pdfFixture(), url), /OCR/);
await assert.rejects(() => readPdf(new TextEncoder().encode("not a PDF"), url));
console.log(
  "PASS: real PDF text extraction, page markers, title fallback, page cap, scan-only and corrupt-file rejection.",
);
