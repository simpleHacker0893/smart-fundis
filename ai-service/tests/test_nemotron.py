"""Nemotron structured-output smoke (#9, ADR-4). No network: HTTP is faked.

Only ``requests.Session.get``/``post`` are replaced, so the real ``ChatNVIDIA``
request building and structured-output parsing run against a recorded
chat-completions body in ``tests/fixtures/nemotron_smoke_response.json``.
"""

from __future__ import annotations

import base64
import json
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import quote, quote_plus

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


def test_sends_the_prompt_file_verbatim(api: FakeNvidiaApi) -> None:
    nemotron.nemotron_smoke(_settings())

    (call,) = api.posts
    sent = " ".join(m["content"] for m in call["json"]["messages"])
    assert sent.strip() == nemotron.load_prompt().strip()


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


def _chain(exc: BaseException) -> list[BaseException]:
    """Every exception reachable through __cause__ and __context__."""
    seen: list[BaseException] = []
    todo: list[BaseException | None] = [exc]
    while todo:
        current = todo.pop()
        if current is None or any(current is s for s in seen):
            continue
        seen.append(current)
        todo += [current.__cause__, current.__context__]
    return seen


@pytest.mark.parametrize("status", [401, 500])
def test_exception_chain_holds_no_key_anywhere(api: FakeNvidiaApi, status: int) -> None:
    api.chat_status = status
    api.chat_body = {"status": status, "detail": f"bad key {FAKE_KEY}"}

    with pytest.raises(nemotron.NemotronSmokeError) as info:
        nemotron.nemotron_smoke(_settings())

    chain = _chain(info.value)
    assert chain == [info.value]  # nothing hangs off the error at all
    for exc in chain:
        assert FAKE_KEY not in f"{exc!s} {exc!r} {exc.args!r}"


# --- _scrub: every echo form of the key is redacted, before truncation ---


def test_scrub_redacts_the_exact_key() -> None:
    assert FAKE_KEY not in nemotron._scrub(f"bad key {FAKE_KEY} here", FAKE_KEY)


@pytest.mark.parametrize(
    "echo",
    [
        "nvapi-FAKE-test-key",  # a truncated prefix
        "nvapi-FAKE-test-****-0123",  # a masked echo
        "nvapi-SomeOtherKeyEntirely_42",  # another nvapi token entirely
    ],
)
def test_scrub_redacts_partial_masked_and_other_nvapi_tokens(echo: str) -> None:
    out = nemotron._scrub(f"server said: {echo}", FAKE_KEY)
    assert "nvapi-" not in out
    assert "server said:" in out


@pytest.mark.parametrize(
    "encode",
    [
        lambda k: base64.b64encode(k.encode()).decode(),
        lambda k: base64.b64encode(k.encode()).decode().rstrip("="),
        lambda k: base64.urlsafe_b64encode(k.encode()).decode(),
        lambda k: quote(k, safe=""),
        lambda k: quote_plus(f"Bearer {k}"),
    ],
    ids=["b64", "b64-nopad", "b64-urlsafe", "url", "url-plus-bearer"],
)
def test_scrub_redacts_encoded_forms(encode: Callable[[str], str]) -> None:
    key = "nvapi-Ab+/Cd=Ef/Gh+Ij~Kl 0123"  # characters that encoding changes
    echo = encode(key)
    out = nemotron._scrub(f"echo {echo} end", key)
    assert echo not in out
    assert "echo" in out
    assert "end" in out


def test_scrub_redacts_before_truncating() -> None:
    # The key straddles the cut: redacting after truncation would leave a prefix.
    text = "x" * (nemotron._MAX_ERROR_CHARS - 10) + FAKE_KEY
    out = nemotron._scrub(text, FAKE_KEY)
    assert FAKE_KEY[:10] not in out
    assert "nvapi-" not in out


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


class ExplodingClient:
    def flush(self) -> None:
        raise RuntimeError(f"flush failed with {FAKE_KEY}")


@pytest.mark.parametrize(
    ("settings", "code", "stdout_needle", "stderr_needle"),
    [
        (_settings(), 0, f"model: {MODEL}", "flush"),
        (_settings(key=None), 1, "", "NVIDIA_API_KEY"),
    ],
    ids=["success", "failure"],
)
def test_main_keeps_result_and_exit_code_when_flush_raises(
    api: FakeNvidiaApi,
    capsys: pytest.CaptureFixture[str],
    monkeypatch: pytest.MonkeyPatch,
    settings: Settings,
    code: int,
    stdout_needle: str,
    stderr_needle: str,
) -> None:
    monkeypatch.setattr(nemotron, "configure_tracing", lambda: True)
    monkeypatch.setattr(nemotron, "masked_client", ExplodingClient)
    monkeypatch.setattr(nemotron, "get_settings", lambda: settings)

    assert nemotron.main() == code

    out, err = capsys.readouterr()
    assert stdout_needle in out
    assert stderr_needle in err
    flush_lines = [line for line in err.splitlines() if "flush" in line.lower()]
    assert len(flush_lines) == 1  # one scrubbed line, no traceback
    assert "Traceback" not in err
    assert FAKE_KEY not in out + err
