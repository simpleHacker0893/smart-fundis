# Risks

| # | Risk | Likelihood / impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| R-1 | Brev credits, provisioning or the model download is slow or fails on the day | M / H | The V1 stub worker keeps the loop demoable. The 2B fallback exists. Start the download at H0. | gpu-devops |
| R-2 | Cosmos can't read handwritten digits reliably | M / M | Every miss is capped at `needs_review` (ADR-19), and the Expert checks. The eval includes wrong and missing codes. Make no accuracy claim until measured. | ai-pipeline |
| R-3 | A 90 s clip at fps 4 exceeds `--max-model-len 8192` | M / H | Test one 90 s clip early in lane B. If it's too long, lower the fps for long clips (a new decision needed). The 90 s cap stays. | ai-pipeline |
| R-4 | Only 4 hours of build time if the start is 11:00 | M / H | The anchors are relative (freeze at H+4), the cut order is agreed, and V4 is optional. | architect |
| R-5 | A leaked video URL stays public | L / M | URLs come only from the detail query and claim, and are never logged. This is listed as a known limitation. | convex |
| R-6 | The Stitch tools fail or run past 45 minutes | M / M | The prompt files also work in the Stitch web app, and the fallback is plain shadcn. | frontend |
| R-7 | Stock clips miss cornrows and real socket work | H / M | The team records its own core clips (ADR-14). | architect |
| R-8 | The Claude GitHub App or its secret isn't set up, so the review check never runs | M / M | Set it up before Sunday (prompt `00`). The fallback is a local `/code-review` only. | architect |
| R-9 | A demo seed shown as verified misleads the judges | L / H | The `isDemo` tag appears on every Badge and demo profile, and the seed is disclosed. | qa |
| R-10 | The Convex plugin hooks slow down every turn (the type-check at the end of a turn) | M / L | Watch for it. If it's too slow, disable the plugin's Stop hook for lane B sessions. | architect |
