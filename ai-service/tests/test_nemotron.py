"""Nemotron structured-output smoke (#9, ADR-4). No network: HTTP is faked.

Only ``requests.Session.get``/``post`` are replaced, so the real ``ChatNVIDIA``
request building and structured-output parsing run against a recorded
chat-completions body in ``tests/fixtures/nemotron_smoke_response.json``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pytest
import requests
from pydantic import SecretStr

from app import nemotron
from app.settings import Settings

FIXTURES = Path(__file__).parent / "fixtures"
RECORDED = json.loads((FIXTURES / "nemotron_smoke_response.json").read_text(encoding="utf-8"))
FAKE_KEY = "nvapi-FAKE-test-key-must-never-leak-0123456789"
MODEL = RECORDED["model"]


def _response(status: int, body: dict[str, Any]) -> requests.Response:
    response = requests.Response()
    response.status_code = status
    response._content = json.dumps(body).encode()
    response.headers["Content-Type"] = "application/json"
    response.url = "https://integrate.api.nvidia.com/v1/fake"
    return response


@dataclass
class FakeNvidiaApi:
    """Stands in for integrate.api.nvidia.com. Records every request."""

    chat_status: int = 200
    chat_body: dict[str, Any] = field(default_factory=lambda: RECORDED)
    posts: list[dict[str, Any]] = field(default_factory=list)

    def get(self, _session: requests.Session, url: str, **_: Any) -> requests.Response:
        assert url.endswith("/models"), f"unexpected GET {url}"
        listed = {self.chat_body.get("model", MODEL), MODEL}
        return _response(200, {"object": "list", "data": [{"id": m} for m in listed]})

    def post(self, _session: requests.Session, url: str, **kwargs: Any) -> requests.Response:
        assert url.endswith("/chat/completions"), f"unexpected POST {url}"
        self.posts.append({"url": url, **kwargs})
        return _response(self.chat_status, self.chat_body)


@pytest.fixture(autouse=True)
def no_env_leaks(monkeypatch: pytest.MonkeyPatch) -> None:
    """The key must come from Settings, and nothing may trace to LangSmith."""
    for name in ("NVIDIA_API_KEY", "NEMOTRON_MODEL", "LANGSMITH_TRACING", "LANGSMITH_API_KEY"):
        monkeypatch.delenv(name, raising=False)


@pytest.fixture
def api(monkeypatch: pytest.MonkeyPatch) -> FakeNvidiaApi:
    # main() must never load the developer's real repo-root .env in tests.
    monkeypatch.setattr(nemotron, "configure_tracing", lambda: False)
    fake = FakeNvidiaApi()
    monkeypatch.setattr(requests.Session, "get", lambda s, url, **kw: fake.get(s, url, **kw))
    monkeypatch.setattr(requests.Session, "post", lambda s, url, **kw: fake.post(s, url, **kw))
    return fake


def _settings(key: str | None = FAKE_KEY, model: str | None = MODEL) -> Settings:
    return Settings(
        nvidia_api_key=SecretStr(key) if key is not None else None,
        nemotron_model=model,
    )


def test_parses_recorded_response_into_schema(api: FakeNvidiaApi) -> None:
    result = nemotron.nemotron_smoke(_settings())

    assert isinstance(result.reply, nemotron.SmokeReply)
    assert result.reply == nemotron.SmokeReply(
        trade="electrical", ok=True, note="Structured output works."
    )


def test_model_id_from_settings_is_sent_and_reported(api: FakeNvidiaApi) -> None:
    result = nemotron.nemotron_smoke(_settings())

    assert result.model == MODEL
    (call,) = api.posts
    assert call["json"]["model"] == MODEL


def test_requests_json_schema_structured_output(api: FakeNvidiaApi) -> None:
    nemotron.nemotron_smoke(_settings())

    (call,) = api.posts
    schema = call["json"]["response_format"]["json_schema"]["schema"]
    assert set(schema["properties"]) == {"trade", "ok", "note"}


def test_key_is_passed_explicitly_not_read_from_os_environ(api: FakeNvidiaApi) -> None:
    nemotron.nemotron_smoke(_settings())

    (call,) = api.posts
    assert call["headers"]["Authorization"] == f"Bearer {FAKE_KEY}"


def test_prompt_is_a_versioned_file_with_no_user_data(api: FakeNvidiaApi) -> None:
    nemotron.nemotron_smoke(_settings())

    (call,) = api.posts
    sent = " ".join(m["content"] for m in call["json"]["messages"])
    assert sent.strip() == nemotron.load_prompt().strip()
    assert nemotron.PROMPT_FILE.parent.name == "prompts"
    assert nemotron.PROMPT_FILE.is_file()


@pytest.mark.parametrize("key", [None, "", "   "])
def test_missing_key_is_a_clear_config_error(api: FakeNvidiaApi, key: str | None) -> None:
    with pytest.raises(nemotron.NemotronConfigError, match="NVIDIA_API_KEY"):
        nemotron.nemotron_smoke(_settings(key=key))
    assert api.posts == []


@pytest.mark.parametrize("model", [None, "", "   "])
def test_missing_model_is_a_clear_config_error(api: FakeNvidiaApi, model: str | None) -> None:
    with pytest.raises(nemotron.NemotronConfigError, match="NEMOTRON_MODEL"):
        nemotron.nemotron_smoke(_settings(model=model))
    assert api.posts == []


def test_unparseable_reply_is_a_smoke_error(api: FakeNvidiaApi) -> None:
    bad = json.loads(json.dumps(RECORDED))
    bad["choices"][0]["message"]["content"] = '{"trade": "electrical"}'
    api.chat_body = bad

    with pytest.raises(nemotron.NemotronSmokeError, match="schema"):
        nemotron.nemotron_smoke(_settings())


def test_http_error_never_carries_the_key(api: FakeNvidiaApi) -> None:
    # A hostile/echoing error body: the key must still not surface.
    api.chat_status = 401
    api.chat_body = {"status": 401, "title": "Unauthorized", "detail": f"bad key {FAKE_KEY}"}

    with pytest.raises(nemotron.NemotronSmokeError) as info:
        nemotron.nemotron_smoke(_settings())

    assert FAKE_KEY not in str(info.value)
    assert FAKE_KEY not in repr(info.value)
    assert info.value.__cause__ is None
    assert info.value.__suppress_context__


def test_result_repr_has_no_key(api: FakeNvidiaApi) -> None:
    result = nemotron.nemotron_smoke(_settings())
    assert FAKE_KEY not in repr(result)


def test_main_prints_model_and_json_and_exits_zero(
    api: FakeNvidiaApi, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(nemotron, "get_settings", lambda: _settings())

    code = nemotron.main()

    out, err = capsys.readouterr()
    assert code == 0
    lines = out.strip().splitlines()
    assert lines[0] == f"model: {MODEL}"
    assert json.loads(lines[1]) == {
        "trade": "electrical",
        "ok": True,
        "note": "Structured output works.",
    }
    assert FAKE_KEY not in out + err


@pytest.mark.parametrize(
    ("settings", "status", "needle"),
    [
        (_settings(key=None), 200, "NVIDIA_API_KEY"),
        (_settings(model=None), 200, "NEMOTRON_MODEL"),
        (_settings(), 401, "failed"),
    ],
)
def test_main_fails_non_zero_with_clear_message_and_no_key(
    api: FakeNvidiaApi,
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
    settings: Settings,
    status: int,
    needle: str,
) -> None:
    api.chat_status = status
    if status != 200:
        api.chat_body = {"status": status, "detail": f"echo {FAKE_KEY}"}
    monkeypatch.setattr(nemotron, "get_settings", lambda: settings)

    code = nemotron.main()

    out, err = capsys.readouterr()
    assert code != 0
    assert needle in err
    assert FAKE_KEY not in out + err
