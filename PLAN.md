# cmdgenie-cli: fix plan, PR workflow, npm release

## Context
Two reviews (mine + cowork) found overlapping bugs. Merged into vertical slices below. Workflow rules: never commit to main; every change via PR; stop and wait for user approval; never merge myself; one slice = one PR = code + test + README touch.

## Branch + release flow
- `main`: release branch. User manually opens/merges `develop -> main` when develop looks good. Merge to main = npm publish.
- `develop`: integration branch (create from main, push). All slice PRs target `develop`; merging them does NOT deploy.
- Slice branches `fix/<slice>` off develop. I push, open PR to develop, wait for approval.
- Recommend user enables branch protection on main + develop (PR required, CI green).

## Slice 0 — CI + release pipeline
- `.github/workflows/ci.yml`: PRs to develop/main: `npm ci`, `npm test`, `npm pack --dry-run`.
- `.github/workflows/release.yml`: push to `main` only: `npm ci`, `npm test`, publish with `NODE_AUTH_TOKEN=${{ secrets.NPM_TOKEN }}`. Skip if `npm view cmdgenie-cli@<version>` exists (package already live at 0.1.0, so re-merges without a bump must not fail).
- `package.json`: `engines.node >=18`, `license`, `repository`, `keywords`, `"test": "node --test"`.
- User: add `NPM_TOKEN` (automation token) secret; bump `version` on develop before each release PR.

## Slices (PR into develop each; node:test for pure logic)
1. **Safety checker rewrite** (cowork #1, mine): new `src/safety.js` exporting `checkDestructive`. Tokenize command, check program + flags (rm -r/-f/--recursive/--force in any order, sudo prefix, git push -f/--force/--force-with-lease, git reset --hard, git clean -f, chmod 777 any order, dd of=/dev/*, /dev/nvme|sd|disk writes, find -delete / -exec rm, DELETE FROM, DROP, TRUNCATE, kubectl delete, shred, mkfs, docker system prune, fork bomb, curl|sh). Test: table of ~20 risky + a few safe commands.
2. **Stdout hygiene + output integrity** (cowork #2, #3, #10): warnings and key prompt to stderr; `finish_reason === "length"` -> error (and `max_tokens` 80 -> 300); empty reply -> error, exit 1; multi-line reply -> first line / reject. Files `src/cli.js`, `src/openai.js`, `src/config.js` (prompt stream). Test: extract `cleanOutput` pure fn.
3. **Input sanitize + CLI args** (cowork #5, smaller): swap replace order so tab/newline become space; `config` only a subcommand when args[0]==="config" AND args[1] in set-key/set-provider/set-model (else treat as text); add `--help`, `--version`. Test `sanitize`.
4. **Key + config safety** (cowork #6, #7, #8): read `OPENAI_API_KEY` first; hidden prompt input; no prompt if stdin not TTY (clear error); `chmodSync 0o600` after write; on JSON parse error throw instead of returning `{}`.
5. **Provider + model honesty** (cowork #4, mine): `set-provider` accepts only `openai`; add `config set-model`, default `gpt-4.1-nano`; README updated.
6. **OS/shell-aware prompt** (cowork #9): add `process.platform` + `$SHELL` to system prompt in `src/openai.js`.

Order: 0, 1, 2, 3, 4, 5, 6.

## Out of scope (ask first)
- `git filter-repo` to purge old node_modules from history: rewrites main history + force-push, destructive. Not doing unless user explicitly asks.

## Verification
- Each PR: CI `npm test` green; slices 2, 4, 6 also manual run `node bin/cmdgenie "list files bigger than 10MB"` and `cmd=$(node bin/cmdgenie "...")` to confirm stdout is only the command.
- Release: after user merges develop -> main, check Actions run and `npm view cmdgenie-cli version`.
