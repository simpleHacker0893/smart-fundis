// The /ai/* bearer check (spec §6). Both sides are hashed to SHA-256 first, so
// the byte compare always runs over 32 bytes and its time does not depend on
// where, or whether, the token and the secret differ, nor on their lengths.

const PREFIX = "Bearer ";

/** True only for `Bearer <secret>`. An unset or empty secret refuses everyone. */
export async function isWorkerAuthorized(
  authorization: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || authorization === null || !authorization.startsWith(PREFIX)) {
    return false;
  }
  const [token, expected] = await Promise.all([
    sha256(authorization.slice(PREFIX.length)),
    sha256(secret),
  ]);
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= token[i] ^ expected[i];
  }
  return diff === 0;
}

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}
