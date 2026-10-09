# Contributing to AntNet

AntNet is a shared crypto research colony. Contributions should improve source collection, research traceability, reliability, accessibility, or the operator experience.

## Local development

Use Node.js 24 or newer. Run `npm ci`, copy `.env.example` to `.env`, then run `npm run build` and `npm start`. Open http://localhost:3000. Keep credentials out of commits.

Production uses the portable React build. Rebuild after frontend changes; `npm run dev` watches the local server. Retained Next.js routes are an alternative build path, not the deployed Netlify runtime.

## Checks

Run `npm run check`, `npm run test:pipeline`, and `npm run test:netlify`. For relevant changes, also run `node scripts/test-pdf.mjs`, `node scripts/test-rendered-html.mjs`, `node scripts/test-harvest.mjs`, and `node scripts/test-scout-activity.mjs`. Set `TEST_POSTGRES=1` when running the pipeline suite to exercise the PGlite Postgres adapter. Fixture tests do not require production credentials.

## Pull requests

Branch from `main`. Explain the behavior before and after the change and include relevant test results. Use named React exports, TypeScript strict mode and scoped CSS. When adding CSS, update the stylesheet list in `scripts/build-app.mjs`.

Keep decorative animation distinct from server activity. Do not represent token ownership, treasury spending, model training, or financial execution as active without implementing and verifying those features. Scheduling changes must retain explicit cost limits and operator controls.

Use this repository's issues for ordinary bugs and feature requests. Follow [the security policy](SECURITY.md) for vulnerabilities. Preserve the MIT attribution.
