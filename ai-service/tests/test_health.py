"""GET /health reports the service is up and its version (#7)."""

import subprocess
import sys
import tomllib
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

AI_SERVICE = Path(__file__).resolve().parents[1]


def pyproject_version() -> str:
    with (AI_SERVICE / "pyproject.toml").open("rb") as f:
        return tomllib.load(f)["project"]["version"]


def test_health_returns_ok_with_service_and_version() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "ai-service",
        "version": pyproject_version(),
    }


def test_importing_the_app_reads_no_env_file_and_no_secret() -> None:
    # A fresh interpreter, so earlier imports in this test run don't hide it.
    probe = (
        "import dotenv\n"
        "calls = []\n"
        "dotenv.load_dotenv = lambda *a, **k: calls.append(1)\n"
        "dotenv.dotenv_values = lambda *a, **k: calls.append(1) or {}\n"
        "import app.main\n"
        "import app.settings\n"
        "assert not calls, 'a .env file was loaded at import time'\n"
        "assert app.settings.get_settings.cache_info().currsize == 0, 'settings built at import'\n"
    )
    result = subprocess.run(  # noqa: S603 - fixed argv, no shell
        [sys.executable, "-c", probe],
        cwd=AI_SERVICE,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert result.stdout == ""  # nothing printed at import
