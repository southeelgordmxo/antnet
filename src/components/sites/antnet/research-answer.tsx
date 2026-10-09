type Source = { number: number; title: string; url: string };

// Render the small Markdown vocabulary used in research answers as React text.
// Source HTML is never executed; only verified citation records become links.
export function ResearchAnswer({
  answer,
  sources,
}: {
  answer: string;
  sources: Source[];
}) {
  function inline(text: string) {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i}>{part.slice(1, -1)}</code>;
      if (/^\[\d+\]$/.test(part)) {
        const source = sources.find(
          (item) => item.number === Number(part.slice(1, -1)),
        );
        if (source && /^https:\/\//i.test(source.url))
          return (
            <a
              key={i}
              href={source.url}
              title={source.title}
              target="_blank"
              rel="noreferrer"
            >
              {part}
            </a>
          );
      }
      return part;
    });
  }
  return (
    <div className="answer-text">
      {answer.split(/\n\s*\n/).map((block, index) => {
        const lines = block.trim().split("\n");
        if (lines.every((line) => /^\s*[-*] /.test(line)))
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*[-*] /, ""))}</li>
              ))}
            </ul>
          );
        if (lines.every((line) => /^\s*\d+[.)] /.test(line)))
          return (
            <ol key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*\d+[.)] /, ""))}</li>
              ))}
            </ol>
          );
        return (
          <div key={index}>
            {lines.map((line, i) =>
              /^#{1,6} /.test(line) ? (
                <h4 key={i}>{inline(line.replace(/^#{1,6} /, ""))}</h4>
              ) : (
                <p key={i}>{inline(line)}</p>
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}
