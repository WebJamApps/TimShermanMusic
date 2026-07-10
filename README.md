# TimShermanMusic

Tim Sherman's gig and booking site — a React + TypeScript frontend that talks to
the `web-jam-back` API for gig/venue/booking data and is hosted on Cloudflare
Pages.

## Scripts

* `npm run dev` — start the Vite dev server.
* `npm run build` — production build.
* `npm run preview` — preview the production build locally.
* `npm run typecheck` — full `tsc --noEmit` (includes test files).
* `npm run test:lint` — ESLint.
* `npm run test:unit` — Vitest with coverage.
* `npm test` — lint + typecheck + unit tests with coverage (the CI gate).
* `npm run test:watch` — Vitest in watch mode.

## Deploying

Deploys are automatic: CircleCI's `deploy` job runs on `main` after the
`build` (test) job passes, and pushes `dist/` to Cloudflare Pages via
Wrangler. Red tests block the deploy. Auth comes from the
`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` CircleCI project env vars
(Pages project name `timshermanmusic` is passed directly in the config). The
`deploy` job fails fast with a clear message if either env var is unset.

Cloudflare Pages' own Git integration is deliberately unlinked — CircleCI is
the single deploy gate (mirrors the web-jam-tools#130 pattern).

For a manual/fallback deploy:

```sh
npm run build
npx wrangler pages deploy dist --project-name timshermanmusic --branch main
```
