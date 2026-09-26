"""ADR-13: LangSmith traces carry no video URLs, prompts or feedback text."""

from pathlib import Path

import pytest

from app import tracing

VIDEO_URL = "https://example.convex.cloud/api/storage/abc123?token=xyz"
PROMPT = "You are an electrical inspector. Watch the clip and describe each step."
FEEDBACK = "Good isolation. Test earth continuity before fitting the faceplate."


def assessment_run() -> dict:
    return {
        "assessment_id": "k17abc",
        "trade": "electrical",
        "video_url": VIDEO_URL,
        "prompt": PROMPT,
        "messages": [{"role": "user", "content": PROMPT}],
        "observations": [
            {"rubric_item_id": "isolate", "observed": "yes", "timestamp_s": 4},
            {"rubric_item_id": "earth", "observed": "unclear", "note": FEEDBACK},
        ],
        "verdict": "needs_review",
        "feedback_en": FEEDBACK,
        "feedback_sw": "Kazi nzuri.",
    }


def test_mask_removes_video_urls_prompts_and_feedback() -> None:
    masked = tracing.mask(assessment_run())
    flat = repr(masked)
    for secret in (VIDEO_URL, "example.convex.cloud", PROMPT, FEEDBACK, "Kazi nzuri"):
        assert secret not in flat


def test_mask_keeps_structural_fields_for_debugging() -> None:
    masked = tracing.mask(assessment_run())
    assert masked["assessment_id"] == "k17abc"
    assert masked["trade"] == "electrical"
    assert masked["verdict"] == "needs_review"
    assert masked["observations"][1]["rubric_item_id"] == "earth"
    assert masked["observations"][1]["observed"] == "unclear"
    assert masked["observations"][0]["timestamp_s"] == 4


def test_mask_redacts_urls_even_under_allowed_keys() -> None:
    assert tracing.mask({"status": "see https://x.io/v.mp4"})["status"] == tracing.MASKED


def test_mask_keeps_only_the_exception_type_of_an_error() -> None:
    error = f"ValueError('bad clip {VIDEO_URL}')\nTraceback ... {PROMPT}"
    assert tracing.mask({"error": error}) == {"error": "ValueError"}


def test_client_masks_every_upload_path() -> None:
    # The private _hide_run_* methods are exactly what the client calls
    # before upload, so this checks the real path without a network call.
    client = tracing.masked_client(api_key="test-key")
    for hide in (
        client._hide_run_inputs,
        client._hide_run_outputs,
        client._hide_run_metadata,
    ):
        assert VIDEO_URL not in repr(hide(assessment_run()))
    assert PROMPT not in client._hide_run_error(f"RuntimeError('{PROMPT}')")


def test_configure_defaults_the_project_without_overriding(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name in ("LANGSMITH_PROJECT", "LANGSMITH_API_KEY", "LANGSMITH_TRACING"):
        monkeypatch.delenv(name, raising=False)
    env = tmp_path / ".env"
    env.write_text("LANGSMITH_API_KEY=\nLANGSMITH_TRACING=\n")

    assert tracing.configure_tracing(env) is False  # no key, so tracing is off
    assert tracing.os.environ["LANGSMITH_PROJECT"] == "smart-fundis-agent"

    monkeypatch.setenv("LANGSMITH_PROJECT", "other")
    monkeypatch.setenv("LANGSMITH_API_KEY", "lsv2_test")
    monkeypatch.setenv("LANGSMITH_TRACING", "true")
    assert tracing.configure_tracing(env) is True
    assert tracing.os.environ["LANGSMITH_PROJECT"] == "other"


def test_configure_loads_only_langsmith_names_from_the_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name in ("NVIDIA_API_KEY", "AI_SHARED_SECRET", "LANGSMITH_PROJECT", "LANGSMITH_TRACING"):
        monkeypatch.delenv(name, raising=False)
    env = tmp_path / ".env"
    env.write_text(
        "NVIDIA_API_KEY=nvapi-from-file-must-stay-out\n"
        "AI_SHARED_SECRET=shared-from-file\n"
        "LANGSMITH_PROJECT=from-file-project\n"
        "LANGSMITH_TRACING=false\n"
    )

    tracing.configure_tracing(env)

    assert "NVIDIA_API_KEY" not in tracing.os.environ
    assert "AI_SHARED_SECRET" not in tracing.os.environ
    assert tracing.os.environ["LANGSMITH_PROJECT"] == "from-file-project"
    assert tracing.os.environ["LANGSMITH_TRACING"] == "false"


def test_configure_never_overrides_langsmith_values_already_set(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("LANGSMITH_PROJECT", "from-brev-env")
    env = tmp_path / ".env"
    env.write_text("LANGSMITH_PROJECT=from-file\n")

    tracing.configure_tracing(env)

    assert tracing.os.environ["LANGSMITH_PROJECT"] == "from-brev-env"


def test_decorating_does_not_build_the_client_before_env_is_loaded() -> None:
    # The client reads LANGSMITH_API_KEY when it is built, so building it at
    # import time (before configure_tracing) would send traces with no key.
    tracing.masked_client.cache_clear()
    tracing.traced("never_called")(lambda: None)
    assert tracing.masked_client.cache_info().currsize == 0


def test_configure_rebuilds_the_client_with_the_loaded_key(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("LANGSMITH_API_KEY", raising=False)
    tracing.masked_client()  # built early, keyless
    env = tmp_path / ".env"
    env.write_text("LANGSMITH_API_KEY=lsv2_from_file\n")
    tracing.configure_tracing(env)
    assert tracing.masked_client().api_key == "lsv2_from_file"


def test_smoke_run_returns_its_verdict(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LANGSMITH_TRACING", "false")
    assert tracing.smoke() == {"assessment_id": "smoke-0001", "verdict": "needs_review"}
