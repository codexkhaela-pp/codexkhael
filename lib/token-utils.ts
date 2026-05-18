import { randomUUID, createHash } from "node:crypto";

/**
 * Generates a plain-text reset token and its SHA-256 hash.
 * The plain token is sent to the user; the hash is stored in DB.
 */
export function generateResetToken(): { plainToken: string; tokenHash: string } {
  const plainToken = randomUUID();
  const tokenHash = hashToken(plainToken);
  return { plainToken, tokenHash };
}

export function hashToken(plainToken: string): string {
  return createHash("sha256").update(plainToken).digest("hex");
}
