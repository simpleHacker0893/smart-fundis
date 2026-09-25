# 00 — One-time platform setup

**Run it once, before any code.** Claude checks what it can on its own. Then it writes a bash wizard with `mattpocock-skills:wizard` for the steps only you can do, such as dashboards, logins and secrets. You run the wizard in a **separate Git Bash window**, because it's interactive and `!` can't answer its prompts.

This prompt only creates accounts. **Changed on first run (D-10):** there's no Claude GitHub App or secret, and no branch protection (the repo is private on a free plan), so code review is manual and stages 1 and 6 below were dropped from the wizard. The keys are wired into `web/.env.local`, `npx convex env set` and Vercel later, in the V0 `ready-for-human` ticket, because `web/` and `convex/` don't exist yet.

```
You are the main session, acting as the Architect. Read AGENTS.md, planning/STATE.md, planning/QUESTIONS.md,
docs/PRD.md §2 and §7 (the env var table), and .github/workflows/claude-review.yml.

Step 1 — do these checks yourself, and don't put them in the wizard:
- Run `git status`. If there's uncommitted work, list it and ask me to commit and push it to main now, before
  branch protection is on. Don't commit it yourself.
- Check the tools and report their versions: git, gh (and `gh auth status`), node (20 or later), pnpm (D-12), python
  (3.11 or later), and uv. For any tool that's missing, give me the install command for Windows.
- Check that `gh api repos/simpleHacker0893/smart-fundis` works, and whether sub-issues and issue dependencies
  are already available on it.
- Ask me whether Convex plugin telemetry should be off (QUESTIONS #7 recommends yes). If yes, add
  "env": {"CONVEX_PLUGIN_TELEMETRY": "0"} to .claude/settings.json yourself.

Step 2 — use the mattpocock-skills:wizard skill to write scripts/wizards/00-setup-once.sh, with one stage each for:
1. The Claude GitHub App. Tell me to run `/install-github-app` in Claude Code, or open
   https://github.com/apps/claude. Then set the repo secret ANTHROPIC_API_KEY with `gh secret set`, since that's
   what claude-review.yml reads. If I'd rather use CLAUDE_CODE_OAUTH_TOKEN, the stage says which two lines of
   the workflow to swap, and the wizard doesn't edit them.
2. Clerk. Create the application as a development instance, with email and Google sign-in (ADR-16). Create the JWT
   template named exactly `convex`, with the claims email, email_verified and name. Note where the Publishable key,
   the Secret key and the Frontend API URL are, but don't capture them yet (that's V0).
3. Convex. Sign in at dashboard.convex.dev and create or pick the team. The project itself gets created by
   `pnpm dev:convex` in V0.
4. Vercel. Sign in and connect the GitHub account. The import, with root `web/`, happens in V0, once `web/` exists.
5. The AI accounts for lane B: an API key from build.nvidia.com, a LangSmith API key, and the Cosmos-Reason2
   licence accepted on Hugging Face (8B and 2B). Keep the values in a password manager, because they're only
   used on the Brev box (V2) and never go in this repo.
6. Branch protection on main, applied with `gh api -X PUT repos/simpleHacker0893/smart-fundis/branches/main/protection`:
   require a pull request, require the status check `claude-review`, block force-pushes and deletions, and leave
   enforce_admins off so the Architect can still push docs commits. Put it last and gate it with a confirmation,
   after stage 0 has checked that main is clean and pushed.

Wizard rules: no secret value is ever echoed, logged or written to a file in the repo, and hidden input only
goes to `gh secret set`. Each stage says exactly what to click, gives the URL, and waits for me to confirm.
The script holds no values, so commit it, because the lane B teammate will run it too.

Step 3 — after I've run the wizard and pasted its closing summary:
- Check what you can yourself: `gh secret list`, `gh api .../branches/main/protection`, and the app's installation
  on the repo. Report anything that failed.
- In planning/STATE.md, move "accounts and secrets" and "the Claude GitHub App and branch protection" to Done, and
  set the next action to prompt 05.
- In planning/QUESTIONS.md, answer #7 (telemetry), and #6 (domain) if I told you.
- Commit with "chore: one-time platform setup (00)". Don't push. Tell me to push, then to run prompt 05.
```
