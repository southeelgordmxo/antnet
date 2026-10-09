# AntNet on Netlify

Website: https://antnet.live (fallback: https://antnet-colony.netlify.app)

Dashboard: https://app.netlify.com/projects/antnet-colony

Project ID: `6869f9c8-3b22-4e92-862b-104c3a667d37`.

## Private settings

In Netlify, open **Project configuration → Environment variables**. Use the production context and redeploy after changes. Use private server-side environment variables in your own Netlify account. Only server code reads credentials; the frontend build never embeds them. If the account is upgraded, restrict credentials to Functions and mark them as secrets.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Your Claude API key, stored privately in Netlify. Never expose it to frontend code. |
| `ANTNET_CLAUDE_ENABLED` | Set `true` after adding your own key. Prevents a Netlify-injected gateway key from being used as a direct Anthropic credential. |
| `ANTHROPIC_BASE_URL` | `https://api.anthropic.com`. Explicitly configured for direct Anthropic usage. |
| `ANTHROPIC_MODEL` | Optional account-enabled model. Default `claude-sonnet-5-5`. |
| `OPERATOR_SECRET` | Random key, at least 24 characters, for the colony operator. Generated in the private local `.env` and configured as a private Netlify environment variable. |
| `PUBLIC_COLONY` | Currently `true`: the site is public and scheduled dispatch checks eligible work every minute. |
| `NETLIFY_BROWSER_ENABLED` | Currently `true`: use bundled serverless Chromium to render, scroll and capture approved sources. |
| `TOKEN_MINT`, `PUMP_PAIR_URL`, `TREASURY_WALLET` | Fill only after the actual token/pair/treasury has been established. |
| `BROWSER_SERVICE_URL`, `BROWSER_SERVICE_TOKEN` | Optional external Chromium renderer. HTML crawling works without it. |

## Operator workflow

1. Open the public website.
2. Choose **operator** and enter the `OPERATOR_SECRET` from the private `.env` file. This is separate from the Anthropic key. The cookie is secure, HTTP-only, same-site, and expires after eight hours.
3. Create an ant under **mint**, then choose an approved source and page limit under **order**.
4. A background function reads queued pages. Inspect events and collected text under **ants**, **order**, and **library**.
5. With a valid funded Claude key, completed expeditions produce a summary. **queen** answers questions with source citations. Failed research preserves the sources and shows the provider problem.
6. Use **Colony autopilot → Pause/Enable** in the live observatory. Automatic expeditions are capped at 12 per UTC day, one every 30 minutes, three new pages and six attempted reads each. Pausing cancels outstanding automatic jobs. The operator can use **Forage now** in the top live preview to bring the next automatic expedition forward without bypassing the daily cap. Manually submitted URL expeditions retain their own limits.

Anyone who can view the site can read collected research. Only the operator can create identities, submit/cancel jobs, pause ants, or ask Claude. Wallet connection does not authenticate ownership or grant operator access. This is a shared colony, not a multi-tenant ownership platform.

## Deploy updates

With Node 24 and Netlify CLI installed:

```sh
npm ci
npm run typecheck
npm run test:pipeline
npm run test:netlify
netlify login
netlify link # Select your own project; the production project ID above is for reference.
netlify deploy --prod --context production --dir out --functions netlify/functions
```

Run the full Netlify build at least once when migrations change; a static folder upload alone does not provision the database or publish the API. Netlify applies migrations from `netlify/database/migrations`. Local SQLite migrations remain in `drizzle` and are independent.

The deploy contains three functions: `api`, `colony-background`, and `scout-schedule`. Each page has a database lease. Postgres uses `FOR UPDATE SKIP LOCKED` for concurrent claim safety. Each background invocation handles one page and closes Chromium; the next page is dispatched after Chromium closes. The minute scheduler recovers queued work if immediate dispatch fails. Browser pages have a 90-second deadline and visual captures have ten-second timeouts. Private-site dispatch forwards the operator's same-site Netlify cookie; scheduled dispatch is disabled until the site is public.

## Current limits

The personal Claude key is configured in the private local environment and Netlify. After the owner added API credits, both a real Queen answer and an automatic expedition report succeeded. Billing is managed at https://platform.claude.com/settings/billing. Monitor your own API key expiry and rotate it before expiration. The browser renderer and scheduled autopilot are live. Token contracts, NFT mint/claims, ownership, burn transactions, reward accounting and payouts remain unimplemented. No fabricated on-chain activity is shown. See the feature table in the main README for the full scope.

## Domain and branding

Production uses `antnet.live`, with `www.antnet.live` redirecting to the primary domain. Namecheap BasicDNS uses an ALIAS at `@` pointing to `apex-loadbalancer.netlify.com` and a CNAME at `www` pointing to `antnet-colony.netlify.app`. Netlify manages HTTPS. Use your own project hostname for a fork. The optional Powered by Netlify badge is disabled in Project configuration → General.
