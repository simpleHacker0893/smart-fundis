# 50 — Open the PR and go through the automated review

```
Ticket: <ISSUE>. You're on its branch, and the local review is clean.

1. Push the branch and open a PR: title "<ISSUE#>: <ticket title>". The body has "Closes <ISSUE>", what
   changed, how to verify, and the acceptance-criteria table from the handoff file.
2. Wait for the "claude-review" check (.github/workflows/claude-review.yml).
   Poll with `gh pr checks <pr> --watch`.
3. Read the review with `gh pr view <pr> --comments`, and apply superpowers:receiving-code-review:
   verify each point technically before you act on it. Fix what holds up, and reply on the PR to what doesn't,
   giving your reasoning. Push, and let the check run again.
4. When the check passes, stop and tell me: "PR ready for merge". I squash-merge it (I'm the Architect).
   Never merge it yourself.
5. After I merge, pull main, delete the branch, and report the new frontier of the slice:
   `gh issue list --label slice:<slice> --state open`.
```
