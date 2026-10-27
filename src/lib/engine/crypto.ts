import crypto from 'node:crypto';

/**
 * Generates an auditable, readable anonymous tracking reference (e.g. FS-SAFE-8492)
 */
export function generateTrackingCode(categoryPrefix: string = 'SAFE'): string {
  const randomNum = crypto.randomInt(1000, 9999);
  return `FS-${categoryPrefix.toUpperCase()}-${randomNum}`;
}

/**
 * Generates a high-entropy secret PIN/passcode for anonymous case claimants (e.g. "7K2M9X")
 */
export function generatePasscode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0, 1, I, O
  let passcode = '';
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, chars.length);
    passcode += chars[idx];
  }
  return passcode;
}

/**
 * Hashes a passcode securely using PBKDF2 with a random 16-byte salt
 * Format stored: "pbkdf2:salt_hex:hash_hex"
 */
export function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(passcode.trim().toUpperCase(), salt, 10000, 32, 'sha256').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verifies a candidate passcode against the stored hashed format using constant-time comparison
 */
export function verifyPasscode(passcode: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'pbkdf2') {
      return false;
    }
    const salt = parts[1];
    const expectedHash = parts[2];
    const candidateHash = crypto.pbkdf2Sync(passcode.trim().toUpperCase(), salt, 10000, 32, 'sha256').toString('hex');

    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');

    if (expectedBuf.length !== candidateBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, candidateBuf);
  } catch {
    return false;
  }
}
