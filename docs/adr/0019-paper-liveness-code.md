---
status: accepted
amends: ADR-10, ADR-11
---

# ADR-19: The Liveness code is written on paper, read by vision, and compared in code

Cosmos Reason 2 sees video frames but cannot hear audio, so a spoken Liveness code (ADR-10) cannot be checked by the AI. Whisper stays a Pilot-stage item. Instead, the Fundi writes the 3-digit code on paper, shows it to the camera, then starts the work in **one continuous shot**. They may also say the code aloud.

The check works in three steps:
1. **Cosmos reads the code blind.** It is *not* given the expected code. It returns the digits it can see, or "none".
2. **`rules.py` compares in plain code.** It checks the returned digits against `assessments.livenessCode`.
3. **Failures cap the verdict.** If the code is unreadable or doesn't match, the liveness check is `unclear`, and the Verdict is capped at `needs_review` (ADR-11).

## Considered options

- **Spoken code only:** the AI would mark every Assessment `unclear`, which makes ADR-11 meaningless.
- **Whisper in the MVP:** this adds a model and extra GPU work on build day.

## Consequences

- **Fundi screens:** the recording tips (US-3.3) and the code screen (US-3.4) say "Write this code on paper, show it to the camera, then start". Step 1 of the landing page's "How it works" shows the paper code.
- **Expert checklist:** it includes "no cut between the code and the work".
- **Eval set:** it includes 2–3 clips with a wrong or missing code.
- **No accuracy claims yet:** we make no claim about how well Cosmos reads handwritten digits until the eval has measured it.
