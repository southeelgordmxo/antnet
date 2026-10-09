import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const ants = sqliteTable("ants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  paused: integer("paused").notNull().default(0),
  created: text("created").notNull(),
});
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    tokens: integer("tokens").notNull(),
    antId: text("ant_id").notNull(),
    created: text("created").notNull(),
  },
  (t) => [uniqueIndex("documents_url_unique").on(t.url)],
);
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  antId: text("ant_id").notNull(),
  status: text("status").notNull(),
  pages: integer("pages").notNull().default(0),
  message: text("message").notNull().default(""),
  target: integer("target").notNull().default(1),
  queue: text("queue").notNull().default("[]"),
  visited: text("visited").notNull().default("[]"),
  lease: text("lease"),
  maxReads: integer("max_reads").notNull().default(100),
  automatic: integer("automatic").notNull().default(0),
  created: text("created").notNull(),
});
export const colonySettings = sqliteTable("colony_settings", {
  id: integer("id").primaryKey(),
  enabled: integer("enabled").notNull().default(0),
  nextRun: text("next_run").notNull().default(""),
  dailyDate: text("daily_date").notNull().default(""),
  dailyRuns: integer("daily_runs").notNull().default(0),
  cursor: integer("cursor").notNull().default(0),
  claudeState: text("claude_state").notNull().default("unverified"),
  claudeError: text("claude_error").notNull().default(""),
  claudeCheckedAt: text("claude_checked_at").notNull().default(""),
});
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  antId: text("ant_id").notNull(),
  kind: text("kind").notNull(),
  url: text("url").notNull(),
  message: text("message").notNull(),
  created: text("created").notNull(),
});
export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: text("sources").notNull(),
  created: text("created").notNull(),
});
