# ai-service

Python service for the AI pipeline (FastAPI + LangGraph), run on the Brev box. It is not an npm workspace.

This folder is only a skeleton for now. Ticket #7 (V0: ai-service scaffold) fills it in with uv, Python 3.12, FastAPI `/health`, pytest and ruff.

- `app/`: the service code (ai-pipeline owns it)
- `eval/`: eval clips list and results (qa owns it)
- `scripts/`: vLLM serving and smoke scripts (gpu-devops owns it)
- `tests/fixtures/`: pytest fixtures

Secrets (`NVIDIA_API_KEY`, `LANGSMITH_API_KEY`, the Hugging Face token) live only on the Brev box, never in this repo.
