// Reuse the colony's parameterized queries with Postgres on Netlify.
// Quoted question marks are SQL literals, never parameter placeholders.
export function postgresQuery(query) {
  let index = 0;
  let quoted = false;
  let output = "";
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === "'") {
      output += char;
      if (quoted && query[i + 1] === "'") output += query[++i];
      else quoted = !quoted;
    } else output += char === "?" && !quoted ? `$${++index}` : char;
  }
  // Postgres requires row locks within the candidate selection to prevent two
  // concurrent runners from claiming the same job under READ COMMITTED.
  if (output.startsWith("UPDATE orders SET lease="))
    output = output.replace(
      "ORDER BY o.created LIMIT 1)",
      "ORDER BY o.created LIMIT 1 FOR UPDATE OF o SKIP LOCKED)",
    );
  // Match the case-insensitive source search used in local SQLite.
  return output.replace(/\bLIKE\b/g, "ILIKE");
}

export function postgresAdapter(pool) {
  const normalize = (row) => {
    if (!row) return null;
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        ["n", "pages", "tokens", "relevance"].includes(key) &&
        typeof value === "string"
          ? Number(value)
          : value,
      ]),
    );
  };
  return {
    prepare(sql) {
      const query = postgresQuery(sql);
      let args = [];
      const execute = () => pool.query(query, args);
      return {
        bind(...values) {
          args = values;
          return this;
        },
        async first() {
          return normalize((await execute()).rows[0]);
        },
        async all() {
          return { results: (await execute()).rows.map(normalize) };
        },
        async run() {
          return { meta: { changes: (await execute()).rowCount } };
        },
      };
    },
  };
}
