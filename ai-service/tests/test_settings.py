"""Settings load the repo-root .env by path (D-13) and never require it."""

import shutil
from pathlib import Path

import pytest
from pydantic import SecretStr

from app import settings

FIXTURES = Path(__file__).parent / "fixtures"
ENV_NAMES = (
    "NVIDIA_API_KEY",
    "NEMOTRON_MODEL",
    "VLLM_BASE_URL",
    "COSMOS_MODEL",
    "COSMOS_FALLBACK_MODEL",
    "CONVEX_SITE_URL",
    "AI_SHARED_SECRET",
    "REDIS_URL",
    "QUEUE_MODE",
)


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ENV_NAMES:
        monkeypatch.delenv(name, raising=False)


@pytest.fixture
def fake_repo(tmp_path: Path) -> Path:
    """tmp/<repo>/ with the fixture as its root .env and an ai-service/app/ inside."""
    repo = tmp_path / "repo"
    (repo / "ai-service" / "app").mkdir(parents=True)
    shutil.copy(FIXTURES / "root.env", repo / ".env")
    return repo


def test_env_path_is_the_repo_root_not_ai_service(fake_repo: Path) -> None:
    module = fake_repo / "ai-service" / "app" / "settings.py"
    assert settings.repo_root_env(module) == fake_repo / ".env"


def test_default_env_path_points_at_this_repos_root() -> None:
    root = settings.REPO_ROOT_ENV.parent
    assert settings.REPO_ROOT_ENV.name == ".env"
    assert (root / "AGENTS.md").is_file()
    assert (root / "ai-service" / "pyproject.toml").is_file()


def test_loads_values_from_the_root_env_file(fake_repo: Path) -> None:
    loaded = settings.load_settings(fake_repo / ".env")

    assert loaded.nemotron_model == "nvidia/fixture-nemotron"
    assert loaded.vllm_base_url == "http://fixture-vllm:8000/v1"
    assert loaded.queue_mode == "celery"
    assert loaded.nvidia_api_key is not None
    assert loaded.nvidia_api_key.get_secret_value() == "nvapi-fake-fixture-key"


def test_a_missing_env_file_is_fine(tmp_path: Path) -> None:
    loaded = settings.load_settings(tmp_path / ".env")

    assert loaded.nvidia_api_key is None
    assert loaded.ai_shared_secret is None
    assert loaded.queue_mode == "inline"
    assert loaded.nemotron_model is None
    assert loaded.cosmos_model == settings.DEFAULT_COSMOS_MODEL


def test_the_environment_wins_over_the_file(
    fake_repo: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("NEMOTRON_MODEL", "from-brev-env")
    assert settings.load_settings(fake_repo / ".env").nemotron_model == "from-brev-env"


def test_secrets_never_appear_in_repr_or_dump(fake_repo: Path) -> None:
    loaded = settings.load_settings(fake_repo / ".env")
    assert "nvapi-fake-fixture-key" not in repr(loaded)
    assert "nvapi-fake-fixture-key" not in str(loaded.model_dump())


@pytest.mark.parametrize("blank", ["", "   ", "\t "])
def test_blank_values_count_as_unset(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, blank: str
) -> None:
    env = tmp_path / ".env"
    env.write_text(f'NVIDIA_API_KEY="{blank}"\nNEMOTRON_MODEL=from-file\nQUEUE_MODE="{blank}"\n')
    monkeypatch.setenv("NEMOTRON_MODEL", blank)  # a blank env var doesn't mask the file

    loaded = settings.load_settings(env)

    assert loaded.nvidia_api_key is None
    assert loaded.nemotron_model == "from-file"
    assert loaded.queue_mode == "inline"


@pytest.mark.parametrize("blank", ["", "   "])
def test_blank_values_passed_directly_count_as_unset(blank: str) -> None:
    built = settings.Settings(
        nvidia_api_key=SecretStr(blank), nemotron_model=blank, cosmos_model=blank
    )

    assert built.nvidia_api_key is None
    assert built.nemotron_model is None
    assert built.cosmos_model == settings.DEFAULT_COSMOS_MODEL


def test_values_are_trimmed() -> None:
    built = settings.Settings(nemotron_model="  nvidia/some-model \n")
    assert built.nemotron_model == "nvidia/some-model"
