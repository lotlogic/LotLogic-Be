import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { EstateAccessStatus } from '@prisma/client';

const HASH_KEY_LENGTH = 64;

export const normalizeEstateAccessStatus = (
  value: unknown,
): EstateAccessStatus | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'set')
  ) {
    return normalizeEstateAccessStatus((value as { set?: unknown }).set);
  }

  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === EstateAccessStatus.LIVE) {
    return EstateAccessStatus.LIVE;
  }
  if (normalized === EstateAccessStatus.GATED) {
    return EstateAccessStatus.GATED;
  }
  return undefined;
};

export const normalizeEstateAccessPassword = (value: unknown): string => {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'set')
  ) {
    return normalizeEstateAccessPassword((value as { set?: unknown }).set);
  }
  return String(value ?? '').trim();
};

export const hashEstateAccessPassword = (password: string): string => {
  const normalized = normalizeEstateAccessPassword(password);
  if (!normalized) {
    throw new Error('Estate access password is required');
  }

  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(normalized, salt, HASH_KEY_LENGTH).toString('hex');
  return `${salt}:${derived}`;
};

export const verifyEstateAccessPassword = (
  password: string,
  storedHash: string | null | undefined,
): boolean => {
  const normalized = normalizeEstateAccessPassword(password);
  if (!normalized || !storedHash) {
    return false;
  }

  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const expected = Buffer.from(expectedHash, 'hex');
  const actual = scryptSync(normalized, salt, expected.length || HASH_KEY_LENGTH);
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
};
