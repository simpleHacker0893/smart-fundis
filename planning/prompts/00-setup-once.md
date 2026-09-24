# 00 — One-time setup

**You run this yourself.** Claude writes a step-by-step guide with `/mattpocock-skills:wizard`.

```
Use /mattpocock-skills:wizard to walk me through these steps, one at a time, and wait for me to confirm each:

1. Install the Claude GitHub App on simpleHacker0893/smart-fundis (`/install-github-app`), and add the repo secret it needs (ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN).
2. Turn on branch protection for `main`: require a pull request, require the status check "claude-review", and block force-pushes.
3. Turn on GitHub sub-issues and issue dependencies for the repo, if they aren't already on.
4. Create the accounts and note the env var names (never the values) against the list in PRD §7:
   - Clerk (development instance; enable Google; JWT template `convex` with the email, email_verified and name claims)
   - Convex (create the project; set CLERK_FRONTEND_API_URL, ADMIN_EMAILS and AI_SHARED_SECRET separately for dev and prod)
   - Vercel (import the repo, root `web/`)
   - build.nvidia.com (API key), LangSmith, and Hugging Face (accept the Cosmos-Reason2 licence)
5. Decide on Convex telemetry. If it's off, add "env": {"CONVEX_PLUGIN_TELEMETRY": "0"} to .claude/settings.json.

When all of that is done, tick the matching lines in planning/STATE.md and answer what you can in planning/QUESTIONS.md.
```
