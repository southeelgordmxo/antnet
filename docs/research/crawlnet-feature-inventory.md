# CrawlNet feature inventory and AntNet parity requirements

Research date: 2026-10-08. This is a reference inventory, not an implementation-completion report. No row below asserts that AntNet already implements a feature. Research did not connect wallets, create orders, burn tokens, claim identities, or call mutation endpoints.

## Evidence and interpretation

- **API** means a downloaded public response in workspace `work/research/`. Most snapshots report times around 2026-10-08 13:12 UTC; they are samples, not continuously current data.
- **Bundle** means behavior read from public client assets saved in that directory. A branch in client code proves supported client behavior, not that its server counterpart currently succeeds.
- **Page** means visible text extracted from the public website. Browser automation was unavailable in this research session; no interaction is claimed as personally exercised.
- **Indexed** means an older search-index rendering. It is useful for discovering populated UI but cannot override newer API configuration.
- Public API origin, verified in `3vuz40p5pm6vy.js`: `https://api.crawlnet.network`. WebSocket: `wss://api.crawlnet.network/v1/live?lite=1`.
- Main reference: [CrawlNet](https://crawlnet.network/), [manual](https://crawlnet.network/man), [Queen](https://crawlnet.network/queen), [mint](https://crawlnet.network/mint), [orders](https://crawlnet.network/order).
- Shared/homepage bundles available: `3vuz40p5pm6vy.js` (API, live store, sales, identity helpers), `27lb3urhua4mb.js` (header, ownership, orders, burns), `0s1ln-70c8ca3.js` (home, screens, training, rewards, subs), `21-zvf3dkr8-b.js` (wallet UI and dependencies). Route-specific detail/mint/gallery bundles were not present at the time of the initial inventory.
- Do not copy the downloaded production bundles into AntNet. They are read-only references. Do not reuse source-specific RPC credentials found in them.

## Product boundary: AntNet uses Claude context

The new AntNet requirement is **Claude context, not pretraining a model from scratch**. Preserve the crawler, source provenance, dataset browsing, task/report, and conversational product capabilities as applicable, but replace the source's scratch-training story with an honestly implemented Claude-backed context workflow.

| Source capability | Required AntNet treatment | Dependency / verification boundary |
| --- | --- | --- |
| Queen pretrained from random initialization | Replace with Claude answers grounded in collected context. Do not claim proprietary model training. | Server-side Claude integration and an actual context store/retrieval mechanism. |
| Dataset/token/chapter coverage | Retain useful collection and context coverage metrics, calculated from AntNet data. | Ingestion, deduplication, metadata and token-accounting jobs. |
| Training progress, parameters, GPU loss/ETA | Do not relabel simulated training as real Claude activity. An ingestion/indexing pipeline may expose its own genuine stages. | Actual queue/stage records; Claude model/config details only if supplied by integration. |
| Queen version history / public weights | Source reference only unless AntNet has its own meaningful context/index release history. | Do not imply downloadable Claude weights. |
| Asynchronous question jobs and cancellation | Useful parity requirement for Claude requests, with loading, error, cancellation and source attribution. | Anthropic API credentials on the server; cancellation semantics must match the implementation. |
| CRAWL burns, identity minting, payouts | Catalogued below as source features; they require an independently configured AntNet token/economic contract. | A visual clone or source API read does not create AntNet ownership, minting or payout infrastructure. |

## Source snapshot: values that resolve earlier ambiguity

`stats.json` reports 195 crawlers (10 crawling), 208,755 pages, 501,407,758 dataset tokens, 4,336 domains and 217/275 mapped projects. `spiders.json` contains 185 owned and 10 Queen crawlers; 185 idle and 10 crawling at capture. Queen v3 is live; v4 is training. A server-rendered page that says v0 or displays ellipses is a loading/default state, not reliable model status.

`orders-config.json` reports orders open, 10,000 CRAWL, 25 target pages, 100 maximum reads, 24-hour approval lifetime, three-hour crawl duration and 30-day policy block. This overrides the older indexed page's 50-page offer and the client's legacy 50-page fallback.

`rewards.json` reports 40% pool allocation, 25-page eligibility threshold, 12-hour current epoch, 177 current crawler reward rows, 15 sub-agent rows, and 380.679258397 SOL paid in aggregate. Not every crawler in the live roster is necessarily present in a given rewards collection. None of the current crawler rows had reached eligibility at capture. Two past epochs were settled but had zero recorded paid SOL and no payout signatures: settlement and payment are separate facts.

## Shared shell, navigation and wallet

| Observed feature | Behavior and supported states | External dependency / evidence |
| --- | --- | --- |
| Main sections | Live `/`, crawlers `/crawlers`, Queen `/queen`, treasury `/treasury`, mint `/mint`, order `/order`, manual `/man`; active section indicated. | Page and header bundle. |
| Conditional routes | `/spawn`, `/spawn#crawler`, `/spawn#sub`, `/mine`, crawler `/c/{name-or-id}`, order `/order/{id}` are generated by source code. | Bundle evidence; not all route layouts audited. |
| Responsive bottom navigation | Compact live/crawlers/Queen/treasury/mint links; live crawling count can appear. | Shared header bundle; responsive dimensions not measured in this session. |
| Token contract copy | Full configured contract is copied, with brief copied feedback; shortened contract is displayed. Unknown mint uses a placeholder. | Clipboard API, dynamic spawn configuration. |
| Market summary / buy | Optional market-cap summary; token link goes to pump.fun. Source chooses market pairs by liquidity. | DexScreener and pump.fun. Must use AntNet's actual contract if configured. |
| Social link | Source navigation points to `https://x.com/crawlnetwork`. | Public outbound link; do not accidentally retain source branding in AntNet. |
| Wallet chooser | Detected-wallet list, connecting state, refusal/error message, install links if unavailable; mobile deep links for Phantom/Solflare. | Solana Wallet Standard/mobile adapters and wallet extensions/apps. |
| Wallet dialog accessibility | Source code implements modal, initial focus, Tab wrapping, Escape close, outside-click close and restored prior focus. | Client browser behavior from wallet bundle. |
| Connected wallet menu | Shortened address toggles menu; copy address, Solscan account, disconnect. Menu closes on pointer exit. | Wallet provider, Clipboard, Solscan. |
| Owned-assets navigation | Mine count combines live owned crawlers with owner response crawlers/subs. Distinct main/sub counts are retained. | `GET /v1/owners/{wallet}` plus live roster. |
| Live footer | Connected/reconnecting indicator, crawling count, current Queen name, local clock/date. | Live socket and browser time. Clock should not be confused with UTC ledger timestamps. |
| Keyboard helpers | Plain-key shortcuts are ignored for modifiers, repeated events, editable targets and open modal dialogs. | Shared bundle; exact page shortcut bindings need route-level inspection. |

## Live dashboard and crawler screens

| Observed feature | Behavior and supported states | External dependency / evidence |
| --- | --- | --- |
| Headline metrics | Awake crawlers, pages, dataset tokens, domains, compute SOL and current Queen. Desktop/compact presentations exist. | Stats, treasury, live stream. |
| Selected crawler screen | Previous/next selectors, selected index/count, name/ID, current URL, thought/status and external page link. Touch movement over 50px changes crawler. | `0s1ln-70c8ca3.js`, `/v1/spiders`, frames. |
| Process-style roster | Rows select the large screen. Fields include synthetic PID, name, kind, activity state, host, total pages, uptime and URL path. Numeric crawler ordering is stable. | Homepage bundle and spider data. |
| Dashboard meters | Awake/total, next-version data or active training progress, and project coverage. | Stats/training data. Training meter is source-only under the Claude product change. |
| Recent pages for selection | Up to 24 recent selected-crawler pages, newest first; time, host/title and token count; empty state. | Live page nodes, limited local cache; not complete crawler history. |
| Compact crawler links | Crawler name/status/host/page total, sub-agent count and closed-sub-sales marker. | Live roster and `/v1/subs`. |
| Activity feed | Pages, ledger events and new owned-crawler events. Page events include source crawler, host and token count when available. | WebSocket messages; bounded to 40 feed entries. |
| Real frame images | Source displays captured remote browser images with crawler animation overlaid. Raster frames are not an interactive embedded remote browser. | `GET /v1/spiders/{id}/frame.jpg`; frame notices/binary data via socket. |
| Frame sizing and visibility | Requests 320/640/1280 widths based on display size/density. Pauses work for offscreen/hidden screens. Keeps prior usable image during replacement. | Browser IntersectionObserver/ResizeObserver, frame server. |
| Screen states | Idle/error overlays; delayed waking indicator if no good frame. Idle/error stops overlay motion. Missing/blank frame handling and reload probes are present. | Screen bundle; real error/blank branches were not triggered during research. |
| Crawler overlay behavior | Animation responds to page link geometry, target and URL. Source can visually mutate/highlight link text as part of its canvas effect. | Spider fields `links`, `target`, URL and client simulation. It is an animation over real screenshots. |
| Connection recovery | Initial HTTP seeds for stats, spiders, latest graph and ledger; socket updates thereafter. Reconnect uses backoff/jitter, heartbeat and stale-connection detection. | API + WebSocket; retain honest reconnecting/stale state in AntNet. |
| Bounded live cache | Initial 500 graph nodes; at most 700 nodes, 1,400 edges, 600 ledger entries and 40 feed items in client store. Up to 64 requested frame subscriptions. | Shared live store. These are UI cache limits, not total dataset counts. |

## Crawler identities, ownership, spawning and sub-agents

| Observed feature | Behavior and supported states | External dependency / evidence |
| --- | --- | --- |
| Crawler record | ID, display name, kind, owner, burn transaction, activity status, URL/title, current target, link boxes, pages read, thought, relevance, start/update timestamps. Owner and burn can be null for Queen crawlers. | `spiders.json`. |
| Crawler lifecycle states | UI handles crawling, returning, idle and error. Snapshot currently contains only crawling and idle. | Homepage bundle and roster snapshot. |
| Stable detail links | Display names preferred; duplicate case-insensitive names use normalized crawler ID. Lookup accepts raw ID, normalized ID, or name. | `crawlerPath`/`findCrawler` helpers. `/c/{slug}` layout and full data were not audited. |
| Ownership distinction | Owned crawler vs Queen-operated crawler; public owner and burn provenance. | Spider data; Solscan outbound helpers. |
| Owner portfolio contract | Response must have wallet, crawler array and totals. Optional bag/sub records influence ownership counts. Input wallet validated as a 32–44 character base58-like address. | `GET /v1/owners/{wallet}`. Full owner payload was not available initially. |
| Owner refresh states | Cached/deduplicated reads, regular polling while visible, manual refresh invalidation, previous data retained on fetch failure. | Shared owner hook. |
| Owner metrics supported by helpers | Earned/cap totals, capped crawler count, paid vs priced cost/recouped ratio, burned token totals including refuels, signed gains, compact SOL/USD and share-card cache stamp. | Shared helpers and owner style names. These establish data capabilities, not a verified full portfolio layout or executable refuel flow. |
| Main/sub availability | Main-open takes precedence; otherwise sub-open; otherwise mint identity CTA. Unknown/open/paused/cap-reached/closed states are distinguished by configuration. | `/v1/spawn` config, shared sales helpers. |
| Main sale cap | Source manual says main sales closed at 200. Bundle has a 200-main constant for sub-sale selection and cap-aware main availability. | Manual/bundle; current sales config should be read before enabling a CTA. |
| Main spawn input contract | Name and optional seed URL accompany burn signature. Seed must be <=2,048 characters, http(s), public, without credentials; X/Twitter excluded. | POST `/v1/spawn`; bundle validation. Name limits not established from available route code. |
| Rejected seed recovery | If the credited burn is valid but seed is rejected, client retries hatching without seed rather than discarding the paid action. | Shared hatch function. |
| Burn transaction | Resolves SPL Token or Token-2022 mint, reads decimals/account, constructs checked burn and signed memo, requests wallet transaction, watches signature confirmation. | Solana RPC, wallet, token programs. AntNet needs its own configured mint and RPC. |
| Burn outcome states | Reading mint, wallet-sign request, confirmation wait, landed, failed, dropped after block expiry, unknown after timeout; then API credit/hatch. | Shared burn helpers; no real transaction executed. |
| Recovery after interruption | Pending spawn and pending sub stored locally with signatures/identity inputs; cross-tab storage notifications. API credit retries transaction-not-found and rate-limit delays. | localStorage, Solana confirmation, API. Never ask for a second burn merely because crediting is delayed. |
| Sub-agent model | Sub has identity/name/owner/burn; parent main ID, parent burn/owner; no independent browser in source manual. | Rewards sub records; manual. |
| Sub-agent purchase contract | Spawn request includes `kind: sub`, signature, name and parent `main`. Signed memo associates parent and sub name. | POST `/v1/spawn`; configured sub burn amount. Snapshot rule: 25,000 tokens. |
| Sub market | Lists/filter by main and/or owner; response contains subs, total and closed-main set; aggregate counts per parent. | `GET /v1/subs?main=...&owner=...`. |
| Parent closes sub sales | `closedMains` explicitly supported; closed badges and signed sub-sale message helper exist. | Bundle. Mutation endpoint/control for changing it not established; do not invent one. |
| Sub sale phases | Disabled, not-yet-started, open, sold-out; alive/cap/remaining; activation time/epoch; weight, royalty and earnings cap supplied by config. | `/v1/spawn` sub object; shared sales parser. |
| Sub reward eligibility | Parent must reach epoch page threshold. Sub weight 0.25; fields include eligible, capped, multiplier, share, owner amount, royalty amount and parent page count. | `rewards.json`. |
| Parent royalty | Configured royalty 2,000 basis points (20%). When parent and sub owner are the same, sample records allocate no separate royalty and keep full share with that owner. | Rewards records; use server accounting rather than naive double counting. |

## Dataset, Queen and training reference

| Observed feature | Behavior and supported states | External dependency / evidence |
| --- | --- | --- |
| Dataset graph | Nodes carry page ID/URL/domain/title, chapter/project association, tokens, crawler and timestamp. Edges link node IDs; totals separate from returned subset. | `web.json`: 500 returned nodes, 235 edges; totalNodes 208,756 and totalEdges 100,579. |
| Nullable page categorization | Some chapter/project associations are null. Unknown categories must not be invented. | Web snapshot. |
| Chapter coverage | Seven ordered categories; covered/target/status. GitHub/Reddit locked with zero targets. A `done` status can coexist with incomplete numerical coverage. | `chapters.json`: do not infer status from covered >= target. |
| Queen summary and history | Version, status, dataset tokens/pages, SOL cost/funding, parameters, trained timestamp and weights URL. Retired, live and training examples exist. | `queen-versions.json`. |
| Revisions and labels | Version 1 record labels itself v1.5 and supplies revision note. Display label can differ from numeric version. | Versions API; preserve explicit label. |
| Token/parameter plan | Source has a v1–v8 target ladder, progress capped at 100%, and planned model sizes. | Shared constants. Do not present as AntNet scratch-training roadmap. |
| Training stages | Export, clean, tokenizer, pretrain, synthetic Q&A, chat tuning, evaluation, release; each with state/note, optional progress/step/steps/loss/ETA. | `queen-training.json`. |
| Training snapshot | v4 first five stages done, chat tuning running, evaluation/release pending; 186M intended parameters. | Training response. This is source status only. |
| Stage states | Done, pending, running, waiting, failed; first unfinished stage drives active panel. Running update older than three minutes is stalled. | Training component. |
| Progress presentation | Determinate progress/loss/ETA when supplied; indeterminate animation when null; queued GPU and resumed-checkpoint explanations. Reduced-motion support. | Training bundle. Null means unavailable, not zero. |
| Change/benchmark comparison | Before/after changes and percentage benchmark rows with absolute difference. | Training snapshot and component. |
| Queen conversation | Question input plus three example prompts. Endpoint accepts question and async flag. | Queen page and API client. |
| Async answers | Initial HTTP 200 direct answer or 202 job. Job ID polled to done/failed, bounded polling interval and timeout; cancellation endpoint called on abort. | POST `/v1/queen/ask`, GET `/v1/queen/ask/{id}`, POST `/v1/queen/ask/{id}/cancel`. |
| Answer failures | Initial rate limit, temporary network failure, repeated job errors, lost/expired job, job failure and overall timeout have distinct handling. | Shared API code. Actual answer schema/source rendering not established from route code. |
| Public model artifacts | v3 weights and local chat assets are public on Hugging Face. Model card discloses public-record additions and generated/open-book chat tuning. | [Official v3 card](https://huggingface.co/Crawlnet/queen-v3). No Claude-weight equivalent is implied. |

## Treasury, rewards and economics

| Observed feature | Behavior and supported states | External dependency / evidence |
| --- | --- | --- |
| Treasury metrics | Public wallet, balance SOL, daily burn, runway, total inflow/outflow, affordable crawler count, update time. | `treasury.json`. Values are server-supplied; do not derive account balance solely from displayed ledger. |
| Public ledger | Entry ID/time/kind, SOL, optional USD, memo, optional transaction. UI merges API/live by ID and sorts newest first. | `treasury-ledger.json`, socket ledger events. |
| Ledger categories | On-chain view requests fees_in, reward, train and other; external transaction/account links use Solscan. | `/v1/treasury/ledger?kinds=fees_in,reward,train,other&limit=200`. |
| Current reward round | Epoch/start/end, pool/per-share, allocation basis points, min pages, earnings cap, eligible crawler/sub rows and payment metadata. | `rewards.json`, polled around every 20 seconds. |
| Historical rounds | Daily legacy epochs and later 12-hour UTC epochs; past pools, eligibility, settlement, prices/bags pending, paid SOL and payout transaction signatures. | Rewards snapshot; timing helpers. |
| Payment proof | Total paid, paid-round count and recipient-wallet count calculated from rounds with actual payout records. | Do not equate `settled: true` with funds sent; observed counterexample above. |
| Qualification feedback | Page-threshold progress, approximate share after eligibility, unknown/estimated state and capped state. | `roundFor` client helper. |
| Earnings cap | Default cap 2× priced burn cost; cap/cumulative earned/capped supplied per asset. Historical/current applicability can differ. | Reward records and cap helpers. |
| Holdings multiplier | Per-crawler bag amount, total bag tokens, owned-main/sub counts, held-now value, pending status and multiplier. Rule points: 100k→1×, 300k→2×, 1m→3×, 3m→4×, 10m→5×. | Rewards API. Use server results; interpolation/account-allocation details should not be guessed. |
| Holding duration / uncapping | Rule exposes 12-hour hold, 100k tokens per crawler to remove cap, 10m maximum and 5× maximum. Capped explanation suggests required per-crawler holdings. | Rewards rule and source copy. Snapshot alone does not establish full historical balance algorithm. |
| Sub income | Quarter weight with parent eligibility; parent-owner royalty, owner share, cost/cap/earned and uncapped state. | Rewards API; avoid counting internal same-owner royalty twice. |
| Estimated rates | Client distinguishes current pace (after an hour), previous round, previous pool with current weights, and so-far bases. Sub/day and incremental wallet gain estimates exist. | Source helper formulas; estimates are not promised yields. |
| Price conversion | Uses liquid DexScreener pair to estimate SOL/USD; may fall back to priced ledger entry. Missing prices remain unavailable. | DexScreener and ledger. |
| Source allocation history | Current 40% owner share; older fallback is 20%. Source dates govern historical round rates. | Bundle and API. Do not apply current rule retroactively. |

## Crawl orders and public reports

| Observed feature | Behavior and supported states | External dependency / evidence |
| --- | --- | --- |
| Order configuration | Open/closed or endpoint absent; burn amount/base units/mint, page target/read cap, approval TTL, crawl deadline and policy block period. | `orders-config.json`; current 25 pages / max 100 reads / 24h / 3h / 30d. |
| URL normalization | Adds https when no scheme supplied. Empty, >2,048 characters, invalid URL, non-http(s), credentials, private host, X/Twitter/t.co, nonstandard port rejected in client. | Shared order validation. Server must independently enforce constraints. |
| Preflight checks | Page text documents robots, reachable real page and prohibited-content checks before burning; older indexed view also names bot walls and single-host scope. | Current page and older index; full server checker implementation not available. |
| Order creation | POST returns normalized order, or busy-host with existing ID, rate-limited, orders-closed, bad-URL, unavailable or unreachable. | POST `/v1/orders`; read-only research did not create an order. |
| Recent orders | Site/status/result/UTC; initial loading; limit and periodic polling. | GET `/v1/orders?limit=...`; latest list payload not initially saved. |
| Order status vocabulary | Pending legacy/unapproved, approved awaiting burn, rejected, expired, crawling, done; unknown values retained rather than silently mapped to success. | Shared status helpers. |
| Public report model | ID, URL/host, requester, creation/approval/expiry, burn config/memo/tx, payer/payment time, target/max reads/deadline, finish time/reason, note, blocked-until. | `asOrder` client decoder. |
| Page report rows | URL/title, accepted/rejected/failed outcome, reason, tokens, crawler identity and time. | Decoder; source page documents public reports. |
| Report totals | Read, accepted, rejected, failed, tokens, optional duplicate count and new/counted count. | Source `countedOf` prefers explicit `counted`, otherwise falls back to `read`; preserve duplicate and accepted distinctions. |
| Completion reasons | pages_target, read_limit, site_exhausted, deadline, site_unreachable, start_page_failed, wall, too_many_failures, content_policy. | Shared decoder's recognized enum. |
| Zero-result explanation | Distinguishes nothing read, still reading, nothing crypto-relevant, duplicates already in dataset, and other rejection reasons. | Result formatter. “Done” alone is not proof of a full target or useful output. |
| Payment credit | POST signature to `/v1/orders/{id}/pay`; retry delays on transaction-not-found and rate limit. | Solana burn + backend confirmation. |
| Pending-payment recovery | Current order and pending signatures retained in localStorage; pay-once map joins duplicate concurrent attempts; busy state tracks in-flight crediting. | Browser persistence + API. |
| Report fetch errors | Unknown order separate from route unavailable, network failure and malformed response. Existing report retained on network error. | GET report hook. |
| Polling | Active pending/approved/crawling about every 5s visible or 15s hidden; terminal states about every 60s. | Source client; expected behavior, not SLA. |

## Mint, claim and gallery

These observations come from current page extraction and an indexed populated rendering of [the mint subdomain](https://mint.crawlnet.network/mint), not the route-specific mint JavaScript. Gallery/API implementation details remain unverified.

| Observed feature | Behavior and supported states | External dependency / evidence |
| --- | --- | --- |
| Collection overview | 1,000 identities; public/claim allocations, current existing supply and sale state. Snapshot: 800/800 public sold out, 166/200 claimed, 966 total. | [Mint page](https://crawlnet.network/mint); sample counts, not fixture truth. |
| Snapshot claims | Prior crawler/sub ownership determines Gen 1/Gen 2 claim; deadline countdown to Oct 9 04:00 UTC; approximate 0.004 SOL rent. Connect-wallet entry state visible. | Claim service, Solana NFT program, wallet. Eligibility-result/claim transaction branches not observed. |
| Gallery filters | All, Gen 1, Gen 2, 1/1 groups; text search supporting number/species/palette; number/rarest sorting; expandable trait filters. | Indexed populated mirror; route API unknown. |
| Trait families | Species, body, eye, palette, habitat, mark, catch. Options carry counts. | Indexed page. Combinatorial matching and reset mechanics not exercised. |
| Identity tiles | Number, generation, species/name; special 1/1 identities included. | Indexed page. Detail modal/page, artwork asset origin and pagination remain unverified. |
| Marketplace destinations | Tensor `https://www.tensor.trade/trade/crawlmd`; Magic Eden `https://magiceden.io/marketplace/crawlmd`. | Source outbound links. Tensor returned bot-check page; no trades attempted. |
| Loading/sold-out states | Direct mint mirror can remain in mint-reading state; primary page visibly sold out while claims open. | Do not collapse public sale, claim availability and gallery readiness into one flag. |

## Public endpoint map

All paths below were found in downloaded public client code or the manual. “Snapshot” names the response already downloaded; other endpoints are contract evidence only. Never point AntNet mutations at the source deployment.

| Method and path under API origin | Purpose / evidence |
| --- | --- |
| GET `/v1/stats` | `stats.json`; aggregate status. |
| GET `/v1/spiders` | `spiders.json`; roster. |
| GET `/v1/spiders/{id}/frame.jpg?w={width}` | Source screen image. |
| WebSocket `/v1/live?lite=1` | hello, stats, spider, page, ledger, frame/frames; client ping and requested frame IDs. |
| GET `/v1/web?limit={n}` | `web.json`; page graph and total counts. |
| GET `/v1/chapters` | `chapters.json`. |
| GET `/v1/queen/versions` | `queen-versions.json`. |
| GET `/v1/queen/training` | `queen-training.json`. |
| POST `/v1/queen/ask` | Question plus async flag; direct result or job. |
| GET `/v1/queen/ask/{id}` | Job status/result. |
| POST `/v1/queen/ask/{id}/cancel` | Cancel job; best-effort client request. |
| GET `/v1/treasury` | `treasury.json`. |
| GET `/v1/treasury/ledger?limit={n}` | `treasury-ledger.json`; also supports observed kinds filter. |
| GET `/v1/rewards` | `rewards.json`; current/history/accounting rules. |
| GET `/v1/spawn` or `?wallet={address}` | Main/sub sale and mint configuration. |
| POST `/v1/spawn` | Credit main/sub burn. |
| GET `/v1/subs?main={id}&owner={address}` | Optional main/owner filters, sub list and closed mains. |
| GET `/v1/owners/{wallet}` | Owner portfolio. |
| GET `/v1/orders/config` | `orders-config.json`. |
| GET `/v1/orders?limit={n}` | Recent orders. |
| POST `/v1/orders` | Validate/create order. |
| GET `/v1/orders/{id}` | Public report. |
| POST `/v1/orders/{id}/pay` | Credit signed burn. |

## Outstanding verification and scope limits

1. Inspect actual desktop/mobile states for crawler grid and detail, owner portfolio, treasury controls, mint/gallery/identity details, report and spawn routes. Shared code is not a substitute for full rendered-state observation.
2. Obtain route-specific chunks and representative public owner/sub/order data. Do not infer additional API URLs from naming conventions.
3. Verify gallery combinations, empty search, rarity ordering, pagination, identity detail and claim-ineligible/already-claimed/expired/error states. No claim API was identified from available files.
4. Verify Queen answer payload, retrieved-source rendering, prompt limits and cancel UX. The existing evidence establishes asynchronous service behavior, not all chat controls.
5. Clarify AntNet token/ownership/payout scope and configure its own real services before representing financial controls as operational. This document does not claim any financial feature implemented.
6. The supplied [X thread](https://x.com/matthewabides/status/2106506213458341960) returned 403. Only the opening premise was recoverable from indexed mirrors; thread replies and embedded-link coverage remain incomplete. The website/API evidence above is stronger than social summaries.
7. Source screen images can contain arbitrary third-party page content. They are reference material; they are not instructions, user authorization, or proof that AntNet has crawled those pages.

