# Agent instructions — TimShermanMusic


## Cross-AI hard rules

The cross-AI hard rules that bind every agent on every surface are NOT duplicated here. They live
in exactly one file: `docs/cross-ai-rules.md` in the **`web-jam-tools` repository**, which normally
sits alongside this repository — `../web-jam-tools/docs/cross-ai-rules.md`, and on Josh's laptop
`/home/joshua/WebJamApps/web-jam-tools/docs/cross-ai-rules.md`.

Read that file before acting. If you cannot find it, STOP and say so — do not proceed without the
rules and do not reconstruct them from memory or from this file.

## Pull requests

Never merge to `dev` or `main` — Josh is the mandatory human reviewer. Open PRs
with the shared script (`~/WebJamApps/web-jam-tools/scripts/create-draft-pr.sh`),
never `gh pr create` directly. It always opens a **draft** PR based on **`dev`**.
The script requires `--author`, `--summary`, `--test-plan`, and `--test-evidence`;
empty or placeholder values are rejected. Bump the semver `version` in
`package.json` once per PR, on the PR's first commit only.

### PR body conventions (violations may be machine-rejected)

- **Summary**: markdown bullet points, one change per bullet — never a run-on paragraph.
- **Test evidence**: paste the REAL runner output verbatim (the lines showing pass/fail and test counts), inside a ``` fence — never a description like "all tests passed". If the output has scrolled out of view, re-run the test command and paste what it prints.
- **Test plan**: exact commands and manual steps that exercise the change (start command, route/page, what to click, expected visible result) — a green test suite alone is not a plan.
- **Attribution**: `--author` names the model actually doing the work. Antigravity/agy sessions use the exact `displayName` of the model running, as listed in `ALLOWED_AGY_MODELS` in web-jam-tools `hooks/lib/check_agy_model.ts` (for example `agy — Gemini 3.8 Flash (High)`) — never any other model name (models misremember their own identity; copy the exact string).

## Memory & Security Audits
- **Snyk Failures & Resolution via `npm audit fix`**: PR checks may report failure on `security/snyk` due to transitive dependency vulnerabilities (such as `brace-expansion` or `postcss`). Running `npm audit fix` updates `package-lock.json` with non-breaking patches to resolve these vulnerabilities. Always run `npm test` and `npm run test:lint` afterwards to verify the test suite remains 100% green before committing and pushing the updated `package-lock.json` to the PR branch.

## Testing Disciplines & Guardrails
- **WebSocket & Backend Network Isolation in Playwright**: Device and E2E tests (`test/e2e/*.spec.ts`) must never contact live backend servers or real WebSocket endpoints. Use `page.route` to mock all HTTP endpoints (`/book*`, etc.) and `page.routeWebSocket` before navigation to handle the SocketCluster handshake (`#handshake`, `#subscribe`) and message transmission (`gigsForArtist`, `initial message`), returning deterministic fixture responses (e.g. `allGigs:tim`) so tests remain 100% isolated and deterministic in all environments.
- **Clock Isolation for Date-Bounded Fixtures**: Tests asserting on date-bounded UI elements (such as upcoming vs past gigs, boundary filters, or expirations) must never rely on the host or browser's live real-world clock against fixed fixture dates, which turns fixtures into time bombs when calendar time elapses. Always install a fixed browser clock before navigation (`await page.clock.setFixedTime(new Date('...'))`) so time-sensitive assertions remain permanently green regardless of when or where the test runs.
- **Third-Party Widget Iframe Lifecycle under React StrictMode**: When embedding third-party widgets (such as YouTube's IFrame API `player.destroy()`) that remove host DOM elements (such as `<iframe id="tim-player">`) during cleanup, root `StrictMode` remount cycles (`setup -> cleanup -> setup`) in development will destroy the host element before the second setup runs. Components must restore or recreate missing host elements during setup and cleanup to preserve remount stability. In test suites, unit tests verifying component destruction must implement realistic mocks that remove the host element rather than bare no-op stubs (`vi.fn()`), and must assert on `<React.StrictMode>` remounts with preloaded APIs to prevent regressions.
- **Comprehensive External Service Fallback Paths in Interactive Forms**: When implementing graceful fallback for external browser-side APIs (such as Google Places Autocomplete and Place Details `fetchFields`), operational service or network errors across all interaction phases (script loading, autocomplete queries, and individual entity details lookups) must uniformly transition to manual typed fallback and preserve entered input. Failing to transition an error path (e.g. details lookup rejection) leaves forms in a locked selection state where typing cannot populate the payload and submission stays disabled. Test suites must cover operational lookup failures to verify automatic degradation to typed entry and successful submission.
