import { ens_normalize } from '@adraffy/ens-normalize';

export class UsernameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsernameError';
  }
}

/**
 * Normalizes a username with ENSIP-15. A username is exactly one ENS label,
 * so dots and empty input are rejected.
 *
 * @throws UsernameError when the input is empty, has a dot, or is not a valid ENS label.
 */
export function normalizeUsername(input: string): string {
  if (typeof input !== 'string' || input.length === 0) {
    throw new UsernameError('Username is empty');
  }

  let normalized: string;
  try {
    normalized = ens_normalize(input);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new UsernameError(`Username is not a valid ENS label: ${reason}`);
  }

  if (normalized.length === 0) {
    throw new UsernameError('Username is empty');
  }
  if (normalized.includes('.')) {
    throw new UsernameError('Username must be a single label without dots');
  }
  return normalized;
}

/** True when `label` is a single ENS label that is already normalized. */
export function isNormalizedUsername(label: string): boolean {
  try {
    return normalizeUsername(label) === label;
  } catch {
    return false;
  }
}
