# 50 — Open the PR and hand it over for manual review

The `claude-review` CI check is off for now (D-10), so the Architect reviews every PR by hand. If `CLAUDE_REVIEW_ENABLED` is ever set to `true`, wait for that check in step 2 as well.

```
Ticket: <ISSUE>. You're on its branch, and the local review (prompt 40 step 5) is clean.

1. Push the branch and open a PR: title "<ISSUE#>: <ticket title>". The body has "Closes <ISSUE>", what
   changed, how to verify, the acceptance-criteria table from the handoff file, and a "Local review" section
   listing what /code-review and convex-reviewer found and how each finding was resolved.
2. Stop and tell me: "PR ready for review: <url>". I review it on GitHub.
3. When I leave review comments, read them with `gh pr view <pr> --comments` and apply
   superpowers:receiving-code-review: verify each point technically before you act on it. Fix what holds up,
   and reply on the PR to what doesn't, giving your reasoning. Push, and tell me it's ready again.
4. I squash-merge it (I'm the Architect). Never merge it yourself.
5. After I merge, pull main, delete the branch, and report the new frontier of the slice:
   `gh issue list --label slice:<slice> --state open`.
```
