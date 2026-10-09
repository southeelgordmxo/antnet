# AntNet API

The Netlify API lives under `/api/` on the website's origin. Reads expose the shared colony; mutations require an operator session. POST requests must carry an Origin matching the website.

## Public reads

| Endpoint | Purpose |
| --- | --- |
| `GET /api/state` | Colony overview, recent sources, events, orders, answers and non-secret configuration |
| `GET /api/library` | Search with `q`, `host`, `offset`, `sort` (newest, tokens, title); 30 records per page |
| `GET /api/document?id=...` | Full saved document |
| `GET /api/frame?ant=...` | Latest stored browser capture |
| `GET /api/harvest` | Research milestones and proposed allocation |
| `GET /api/treasury` | Configured treasury reads or unconfigured state |
| `GET /api/export` | Saved corpus as JSONL |
| `GET /api/session` | Current operator-session status |

## Operator actions

Send JSON with `Content-Type: application/json`. Use the site's sign-in form; never put secrets in URLs.

| Endpoint | Body and action |
| --- | --- |
| `POST /api/session` | `{ "key": "your-private-operator-key" }`; secure HTTP-only session for eight hours |
| `DELETE /api/session` | Sign out; requires same origin |
| `POST /api/ants` | `{ "name": "scout_002" }`; 2–24 letters, digits, underscores or hyphens |
| `POST /api/crawl` | `{ "antId": "...", "url": "https://ethereum.org/", "limit": 3 }` |
| `POST /api/forage` | `{}`; immediate automatic expedition within the daily cap |
| `POST /api/autopilot` | `{ "enabled": true }`; disabling cancels outstanding automatic orders |
| `POST /api/ant/update` | `{ "id": "...", "paused": true }` |
| `POST /api/order/cancel` | `{ "id": "..." }` |
| `POST /api/ask` | `{ "question": "What do the sources say about Ethereum?" }` |
| `POST /api/tick` | Dispatch background work |

Errors contain an `error` string. Common codes are 400 (input), 401 (operator access), 403 (origin), 404 (missing data), 409 (scheduling unavailable), and 503 (infrastructure unavailable). Provider failures do not discard saved pages.

Read-only example: `curl 'https://antnet.live/api/library?q=ethereum&sort=newest'`.

Do not run live mutations in ordinary CI: they create production data and may incur browser or Claude charges. The included tests use fixtures and isolated databases.
