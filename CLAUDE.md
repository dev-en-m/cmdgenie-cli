# cmdgenie-cli

## Git workflow
- Never commit to `main` or `develop` directly. Branch off `develop`, open a PR into `develop`.
- `main` is release-only: the user opens `develop -> main` manually; merging it publishes to npm.
- One vertical slice per PR (code + test + README touch). See `PLAN.md`.
- The agent never merges. The user merges.

## PR review loop
After raising a PR:
1. Run `/subtask` with the PR URL: "review this PR, add comments / inline comments, and say 'APPROVED' in a comment if nothing blocks the merge".
2. Read the review results. Fix the comments on the PR branch, push.
3. Run `/subtask` again on the same PR. Repeat until the subtask reviewer posts an approval comment.
4. Then stop and tell the user the PR is ready. Reviewer approval does not replace the user's approval or merge.

GitHub blocks approving your own PR, so reviewer approval is a PR comment, not a formal review approval.
