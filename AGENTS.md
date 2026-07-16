# Agent instructions — TimShermanMusic

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
- **Attribution**: `--author` names the model actually doing the work. Antigravity/agy sessions are ALWAYS `Antigravity — Gemini 3.5 Flash (Medium)` or `(High)` — never write any other Gemini model name (models misremember their own identity; use this exact string).
