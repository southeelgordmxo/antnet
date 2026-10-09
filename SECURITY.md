# AntNet security policy

The latest `main` branch is the supported development version. AntNet is an early-stage research application, not an audited financial protocol.

## Reporting vulnerabilities

Do not post keys, personal data, active exploit instructions, or private logs in public issues. Use this repository's Security tab to report privately if that option is enabled. Otherwise, open a minimal issue asking the maintainer for a private reporting channel without disclosing vulnerability details. Share affected versions, reproduction steps and impact through the private channel.

## Deployment boundaries

- Store API keys, operator secrets, database credentials and optional browser-service tokens only in private server environments. Never prefix them with `NEXT_PUBLIC_`.
- Netlify read endpoints are public. Mutations require the operator session and same-origin requests. Wallet connection does not grant operator access.
- The local server is for trusted local development. Protect public self-hosted deployments with authenticated infrastructure; the local server does not provide the Netlify adapter's access boundary.
- Collected pages are untrusted input. Approved hosts, robots rules, bounded parsing and Claude source instructions reduce risks but do not eliminate prompt injection or content-quality problems.
- Public exports expose saved research. Do not crawl confidential sources into a public colony.
- Private environments, account screenshots, browser profiles and production data are excluded from this repository. Rotate credentials immediately if accidentally published.

Colony Harvest is a read-only milestone display and a 50% creator-reward allocation proposal. This code does not collect fees, sign transactions, execute swaps or guarantee returns.
