# Research links

Fetch the live docs before using any API (AGENTS.md rule 2). Prefer an `llms.txt` index where one exists.

## By role

| Role | Start here | Then |
| --- | --- | --- |
| **all** | `CONTEXT.md`, `docs/adr/`, `docs/superpowers/specs/` | `docs/PRD.md` |
| architect | https://docs.convex.dev/llms.txt · https://docs.langchain.com/llms.txt · https://docs.nvidia.com/brev/llms.txt | the ADRs, the skill repos below |
| frontend | https://nextjs.org/docs · https://ui.shadcn.com/docs · https://next-intl.dev/docs | https://vercel.com/design/guidelines · https://stitch.withgoogle.com |
| convex | https://docs.convex.dev/llms.txt | [file storage](https://docs.convex.dev/file-storage/upload-files) · [HTTP actions](https://docs.convex.dev/functions/http-actions) · [crons](https://docs.convex.dev/scheduling/cron-jobs) · [testing](https://docs.convex.dev/testing/convex-test) |
| auth | https://clerk.com/docs/nextjs/convex | https://docs.convex.dev/auth/clerk · [JWT templates](https://clerk.com/docs/backend-requests/jwt-templates) · [Clerk + AI](https://clerk.com/docs/guides/ai/overview) |
| ai-pipeline | https://docs.langchain.com/llms.txt | [LangChain NVIDIA provider](https://docs.langchain.com/oss/python/integrations/providers/nvidia) · [LangSmith masking](https://docs.langchain.com/langsmith/mask-inputs-outputs) · the Cosmos links below |
| gpu-devops | https://docs.nvidia.com/brev/llms.txt | [Brev connectivity](https://docs.nvidia.com/brev/cli/connectivity) · https://docs.vllm.ai · https://docs.celeryq.dev · https://fastapi.tiangolo.com |
| qa | https://playwright.dev/docs/intro | https://docs.convex.dev/testing/convex-test · [Clerk testing](https://clerk.com/docs/testing/overview) |

## Cosmos Reason 2 and Nemotron

- [Inference reference: vLLM flags, fps and video input](https://docs.nvidia.com/cosmos/latest/reason2/reference.html)
- [API examples](https://docs.nvidia.com/nim/vision-language-models/latest/examples/cosmos-reason2/api.html)
- [Model card, 8B](https://huggingface.co/nvidia/Cosmos-Reason2-8B), and the 2B card from the same organisation
- [Repository](https://github.com/nvidia-cosmos/cosmos-reason2) · [Cosmos Cookbook](https://nvidia-cosmos.github.io/cosmos-cookbook/)
- [NVIDIA model catalogue (Nemotron)](https://build.nvidia.com/). Check the exact Nemotron model id on the day (PRD open question).

## Skill sources

These are the installed skills, and where to look for more.

| Source | Installed as |
| --- | --- |
| https://github.com/obra/superpowers | plugin `superpowers` |
| https://github.com/mattpocock/skills | plugin `mattpocock-skills`, which includes `to-spec`, `to-tickets`, `grilling`, `domain-modeling`, `tdd` and `code-review` |
| https://github.com/get-convex/convex-backend-skill | plugin `convex`, with skills, subagents, hooks and the MCP server |
| https://github.com/langchain-ai/langchain-skills | plugin `langchain-skills` |
| https://github.com/clerk/skills | plugins `core`, `frameworks` and `features` from `clerk-skills` |
| https://github.com/google-labs-code/stitch-skills | plugins `stitch-build`, `stitch-design` and `stitch-utilities` |
| https://github.com/vercel-labs/agent-skills | standalone skills `vercel-react-best-practices`, `vercel-composition-patterns` and `web-design-guidelines` |
| https://github.com/brevdev/brev-cli | standalone skill `brev-cli` |
| https://github.com/NVIDIA/skills | standalone skill `nvidia-skill-finder`. The full catalogue (382 skills) fails to clone on Windows, so ask the finder instead. None of them covers Cosmos Reason 2 with vLLM. |

## Test clips (PRD §8, ADR-14)

Clips come from your own recordings or licensed stock only. **Pexels** is usable: https://www.pexels.com/license
- Download clips one at a time. Bulk scraping for machine learning is banned.
- Never publish a critical verdict next to a recognisable person.
- Mixkit is banned for AI use under the Envato policy.
- No YouTube or TikTok.
