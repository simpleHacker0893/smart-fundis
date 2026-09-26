import { clerkSetup } from "@clerk/testing/playwright";
import { clerkPublishableKey, missingE2eEnv, skipMessage } from "./env";

/**
 * Fetches a Clerk testing token once for the run (Clerk Playwright docs), so
 * the tests get past bot protection. Without the env it does nothing and the
 * specs skip with the same message.
 */
export default async function globalSetup(): Promise<void> {
  const missing = missingE2eEnv();
  if (missing.length > 0) {
    console.warn(skipMessage(missing));
    return;
  }
  // dotenv: false — the root .env is already loaded; never read web/.env.
  await clerkSetup({ publishableKey: clerkPublishableKey(), dotenv: false });
}
