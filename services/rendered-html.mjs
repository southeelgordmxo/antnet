import { load } from "cheerio";

// Hydrated documentation pages can contain megabytes of application state.
// Keep the article structure, crawl links and exclusion metadata, not the JS.
export function compactRenderedHtml(html) {
  if (Buffer.byteLength(html) > 8000000)
    throw new Error("Rendered page exceeds collection limit.");
  const $ = load(html);
  $("script,style,svg,canvas,iframe,template,noscript,link").remove();
  const allowedAttributes = new Set([
    "href",
    "name",
    "content",
    "id",
    "class",
    "role",
    "aria-hidden",
    "alt",
  ]);
  $("*").each((_, node) => {
    for (const attribute of Object.keys(node.attribs || {}))
      if (!allowedAttributes.has(attribute)) $(node).removeAttr(attribute);
    $(node)
      .contents()
      .filter((_, child) => child.type === "comment")
      .remove();
  });
  const text = $.html();
  if (Buffer.byteLength(text) > 650000)
    throw new Error("Rendered article exceeds collection limit.");
  return text;
}
