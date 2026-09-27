"""Probe a clip and apply the video-quality guard (spec §6, US-4.2; prep doc G1/G3).

``probe`` reads the file with OpenCV. ``guard`` and ``choose_fps`` are pure,
so the thresholds are tested without a video.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

MIN_DURATION_S = 10.0
MAX_DURATION_S = 90.0
MIN_SHORT_SIDE_PX = 360
# Mean luma (0-255) of the sampled frames below this is "too dark" (G3; tune on team clips).
MIN_MEAN_LUMA = 40.0
LUMA_SAMPLES = 16
# fps 4 matches Cosmos training; longer clips drop to fps 2 to fit the context (G1).
FPS4_MAX_DURATION_S = 45.0

ReshootCode = Literal["too_short", "too_long", "low_res", "too_dark"]


class ProbeError(RuntimeError):
    """The file could not be read as a video."""


@dataclass(frozen=True)
class VideoProbe:
    duration_s: float
    width: int
    height: int
    mean_luma: float

    @property
    def short_side(self) -> int:
        return min(self.width, self.height)


@dataclass(frozen=True)
class ReshootReason:
    code: ReshootCode
    en: str


def probe(path: Path, samples: int = LUMA_SAMPLES) -> VideoProbe:
    """Duration, size and the mean luma of ``samples`` evenly spaced frames."""
    import cv2  # imported here so the pure helpers load without OpenCV

    capture = cv2.VideoCapture(str(path))
    try:
        if not capture.isOpened():
            raise ProbeError("cannot open the video")
        frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(capture.get(cv2.CAP_PROP_FPS))
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if frames <= 0 or fps <= 0 or width <= 0 or height <= 0:
            raise ProbeError("the video has no frames or no size")
        lumas: list[float] = []
        for index in sample_indices(frames, samples):
            capture.set(cv2.CAP_PROP_POS_FRAMES, index)
            ok, frame = capture.read()
            if not ok or frame is None:
                continue
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            lumas.append(float(gray.mean()))
        if not lumas:
            raise ProbeError("no frame could be decoded")
        return VideoProbe(
            duration_s=frames / fps,
            width=width,
            height=height,
            mean_luma=sum(lumas) / len(lumas),
        )
    finally:
        capture.release()


def sample_indices(frame_count: int, samples: int) -> list[int]:
    """``samples`` frame indices spread evenly over the clip (mid-points of equal slices)."""
    if frame_count <= 0 or samples <= 0:
        return []
    count = min(samples, frame_count)
    return [int((i + 0.5) * frame_count / count) for i in range(count)]


def guard(video: VideoProbe) -> ReshootReason | None:
    """The reshoot reason for a clip, or None when it may be analysed."""
    if video.duration_s < MIN_DURATION_S:
        return ReshootReason(
            "too_short",
            f"The video is {video.duration_s:.0f} seconds long. Record at least "
            f"{MIN_DURATION_S:.0f} seconds showing the whole task.",
        )
    if video.duration_s > MAX_DURATION_S:
        return ReshootReason(
            "too_long",
            f"The video is {video.duration_s:.0f} seconds long. Keep it under "
            f"{MAX_DURATION_S:.0f} seconds.",
        )
    if video.short_side < MIN_SHORT_SIDE_PX:
        return ReshootReason(
            "low_res",
            f"The video is too small ({video.width}x{video.height}). Record at "
            f"{MIN_SHORT_SIDE_PX}p or higher.",
        )
    if video.mean_luma < MIN_MEAN_LUMA:
        return ReshootReason(
            "too_dark", "The video is too dark to check the work. Record again in good light."
        )
    return None


def choose_fps(duration_s: float) -> int:
    """fps 4 up to 45 s, else fps 2 (G1)."""
    return 4 if duration_s <= FPS4_MAX_DURATION_S else 2
