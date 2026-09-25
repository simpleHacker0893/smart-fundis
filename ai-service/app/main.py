"""The ai-service HTTP app. V0 serves only ``/health``; the pipeline arrives in V2.

Run locally from ``ai-service/``: ``uv run uvicorn app.main:app --reload``.
"""

from __future__ import annotations

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

from app import __version__

SERVICE_NAME = "ai-service"

app = FastAPI(title="Smart Fundis ai-service", version=__version__)


class Health(BaseModel):
    status: Literal["ok"]
    service: str
    version: str


@app.get("/health")
def health() -> Health:
    """Liveness only: it touches no settings, secret or model."""
    return Health(status="ok", service=SERVICE_NAME, version=__version__)
