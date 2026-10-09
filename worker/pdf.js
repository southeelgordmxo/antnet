import { getDocumentProxy } from "unpdf";

// Extract text only. Never render pages, execute PDF scripts, or load attachments.
export async function readPdf(bytes, url) {
  const pdf = await getDocumentProxy(bytes, {
    isEvalSupported: false,
    useWorkerFetch: false,
    disableFontFace: true,
    useSystemFonts: false,
    maxImageSize: 0,
    verbosity: 0,
  });
  try {
    if (pdf.numPages > 40)
      throw new Error("This PDF exceeds the 40-page collection limit.");
    let content = "";
    let read = 0;
    for (let n = 1; n <= pdf.numPages && content.length < 24000; n++) {
      const page = await pdf.getPage(n);
      try {
        const text = await page.getTextContent();
        content +=
          `\n[PDF page ${n}]\n` +
          text.items
            .filter((item) => typeof item.str === "string")
            .map((item) => item.str + (item.hasEOL ? "\n" : " "))
            .join("");
        read = n;
      } finally {
        page.cleanup();
      }
    }
    if (content.replace(/\[PDF page \d+\]|\s/g, "").length < 100)
      throw new Error(
        "No readable PDF text found. Scanned PDFs need OCR, which is not connected.",
      );
    const truncated = content.length > 24000 || read < pdf.numPages;
    content =
      content.slice(0, 24000).trim() +
      (truncated ? "\n[Extraction truncated at 24,000 characters.]" : "");
    const { info } = await pdf.getMetadata();
    const title =
      typeof info.Title === "string" && info.Title.trim()
        ? info.Title.trim()
        : new URL(url).pathname.split("/").pop() || "PDF source";
    return { title: title.slice(0, 240), url, content, links: [] };
  } finally {
    await pdf.loadingTask.destroy();
  }
}
