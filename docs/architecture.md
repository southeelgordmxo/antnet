# AntNet architecture

AntNet collects approved public crypto sources, saves text and provenance, and sends selected excerpts to Claude for cited research. Idle ant patrol is decorative; status labels and persisted events describe actual backend work.

## Data flow

1. An operator submits an order, or the scheduler creates an eligible automatic expedition.
2. A worker claims a queued page using a database lease. Hosted Chromium loads permitted HTML pages, scrolls and saves screenshot frames. PDFs use bounded text extraction.
3. The collector checks indexing rules, extracts readable text, filters relevance and deduplicates URLs and content. Changed sources can refresh existing records.
4. Documents and events are persisted. The next page dispatches after Chromium closes, with the scheduler providing recovery.
5. Completed expeditions send up to six source excerpts to Claude. Answers and source associations are saved. Queen questions retrieve relevant excerpts from the saved corpus.
6. The frontend polls state every three seconds. It does not train Claude or stream continuous browser video.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/components/sites/antnet/` | Views, SVG ant, observatory, library, reports and treasury proposal |
| `src/lib/scout-activity.ts` | Event-derived activity states |
| `src/app/` | Retained Next.js routes and global styles |
| `src/portable.tsx` | Portable React entry point |
| `worker/index.js` | Core API, queue processing, extraction and Claude integration |
| `worker/autopilot.js` | Bounded automatic scheduling |
| `worker/pdf.js` | PDF parsing and limits |
| `worker/harvest.js` | Read-only milestones and proposed allocation |
| `services/browser-engine.mjs` | Chromium navigation, host restrictions and captures |
| `services/netlify-browser.mjs` | Hosted Chromium and screenshot storage |
| `services/postgres-adapter.mjs` | Production SQL adapter |
| `services/operator-auth.mjs` | Signed operator sessions |
| `netlify/functions/` | API, background runner and scheduled dispatcher |
| `netlify/database/migrations/` | Production schema migrations |
| `drizzle/`, `db/` | Local migrations and schema |
| `scripts/` | Builds, local server and verification suites |

## Runtime

Production uses Netlify static assets, Functions, managed Postgres and Blobs. Each background invocation handles one page. The scheduled function checks every minute. Automatic expeditions run at 30-minute intervals, up to 12 per UTC day, targeting three new pages with six attempts. Manual expeditions have separate bounds.

The local Node server persists SQLite under `.local/`. Docker configurations provide optional all-in-one and external-renderer deployments. The Worker interface remains, but the public site runs on Netlify.

## Trust and limitations

Visitors read the shared colony. Operators create identities, submit jobs, change scheduling and ask Claude. Wallets do not establish per-ant ownership. Secrets remain server-side. Source text and model output are untrusted; the UI renders React text and citation links rather than executing scraped HTML.

Token links and treasury reads require mint, pair and wallet configuration. Colony Harvest proposes 50% of received creator rewards after the operating reserve. Its research milestone requires ten new sources across three domains and a report citing at least three of that day's sources. Fee verification, wallet signing and financial execution are not implemented.
