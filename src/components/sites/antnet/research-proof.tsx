/* Native links also serve the portable React build. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { ArrowRight, ArrowUpRight, FileText, Network } from "lucide-react";
import type { Colony } from "./antnet";
import "./research-proof.css";

function sourceHost(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      ? parsed.hostname.replace(/^www\./, "")
      : null;
  } catch {
    return null;
  }
}

function reportExcerpt(answer: string) {
  const paragraphs = answer.split(/\n\s*\n/).map((part) => part.trim());
  const paragraph =
    paragraphs.find((part) => /\[\d+\]/.test(part)) ??
    paragraphs.find((part) => !/^#{1,6}\s/.test(part)) ??
    answer;
  const plain = paragraph
    .replace(/^#{1,6}\s+.*\n/gm, "")
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/[*`_]/g, "")
    .replace(/^\s*(?:[-+] |\d+[.)] )/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 280) return plain;
  return `${plain.slice(0, 277).replace(/\s+\S*$/, "")}…`;
}

function reportHeading(question: string) {
  const automatic = question.match(
    /^Summarize this expedition from ([a-z0-9.-]+)\. Explain the crypto concepts and risks with source citations\.$/i,
  );
  return automatic ? `${automatic[1]} / research brief` : question;
}

export function ResearchProof({
  colony,
  loaded,
}: {
  colony: Colony;
  loaded: boolean;
}) {
  const domains = new Map<string, { count: number; url: string }>();
  for (const document of colony.documents) {
    const host = sourceHost(document.url);
    if (!host) continue;
    const current = domains.get(host);
    domains.set(host, {
      count: (current?.count ?? 0) + 1,
      url: current?.url ?? document.url,
    });
  }
  const rankedDomains = [...domains].sort(
    (a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]),
  );
  const latest = [...colony.answers].sort((a, b) =>
    b.created.localeCompare(a.created),
  )[0];
  const citationNumbers = new Set(
    [...(latest?.answer ?? "").matchAll(/\[(\d+)\]/g)].map((match) =>
      Number(match[1]),
    ),
  );
  const citations = (latest?.sources ?? [])
    .filter(
      (source) => citationNumbers.has(source.number) && sourceHost(source.url),
    )
    .slice(0, 3);
  const excerpt = latest ? reportExcerpt(latest.answer) : "";

  return (
    <section
      className="research-proof"
      aria-label="Collected sources and Claude research"
      aria-busy={!loaded}
    >
      <header className="proof-handoff">
        <span>
          <Network size={13} aria-hidden="true" /> THE RESEARCH TRAIL
        </span>
        <p>
          <strong>
            {loaded ? colony.stats.pages.toLocaleString("en-US") : "—"}
          </strong>{" "}
          saved pages
          <ArrowRight size={13} aria-hidden="true" />
          <span>Claude research</span>
          <ArrowRight size={13} aria-hidden="true" />
          <span>Traceable citations</span>
        </p>
      </header>
      <div className="proof-grid">
        <div className="proof-sources">
          <div className="proof-section-label">
            <span>01 / THE SOURCES</span>
            <a href="/library/">
              Library <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </div>
          <h2>Collected from the open web.</h2>
          <div className="proof-domains">
            {loaded && rankedDomains.length > 0 ? (
              rankedDomains.slice(0, 4).map(([domain, data]) => (
                <a
                  key={domain}
                  href={data.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`Open a collected source from ${domain}; ${data.count} pages in the recent sample`}
                >
                  <span>{domain}</span>
                  <b>{data.count}</b>
                </a>
              ))
            ) : (
              <p>
                {loaded
                  ? "The first collected sources will appear here."
                  : "Loading collected sources…"}
              </p>
            )}
          </div>
          <p className="proof-sample">
            {loaded
              ? `Domain counts from the ${colony.documents.length} most recent saved pages${rankedDomains.length > 4 ? ` · +${rankedDomains.length - 4} other domains` : ""}.`
              : "Connecting to the colony’s source library."}
          </p>
        </div>
        <div className="proof-report">
          <div className="proof-section-label">
            <span>02 / LATEST CLAUDE OUTPUT</span>
            <FileText size={13} aria-hidden="true" />
          </div>
          {loaded && latest ? (
            <>
              <h3 title={latest.question}>{reportHeading(latest.question)}</h3>
              <p className="proof-excerpt">
                {excerpt.split(/(\[\d+\])/g).map((part, index) => {
                  const source = latest.sources.find(
                    (item) =>
                      `[${item.number}]` === part && sourceHost(item.url),
                  );
                  return source ? (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      title={source.title}
                    >
                      {part}
                    </a>
                  ) : (
                    part
                  );
                })}
              </p>
              <div className="proof-report-footer">
                <div
                  className="proof-citations"
                  aria-label="Cited sources in this report"
                >
                  {citations.map((source) => (
                    <a
                      key={source.number}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      title={source.title}
                    >
                      [{source.number}] {sourceHost(source.url)}
                    </a>
                  ))}
                  {!citations.length && (
                    <span>No linked citations in this report.</span>
                  )}
                </div>
                <a className="proof-read" href="/queen/">
                  Read research <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              </div>
            </>
          ) : (
            <div className="proof-report-empty">
              <h3>
                {loaded
                  ? "From collected pages to cited answers."
                  : "Loading the latest research…"}
              </h3>
              <p>
                {loaded
                  ? "Claude’s first completed report will appear here, with links back to its sources."
                  : "Checking saved reports from the colony."}
              </p>
              <a className="proof-read" href="/queen/">
                Open the research desk{" "}
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
