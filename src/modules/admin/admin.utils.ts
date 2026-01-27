import { BadRequestException } from '@nestjs/common';

export function parseBigIntId(value: unknown, fieldName: string): bigint {
  if (typeof value === 'bigint') return value;
  const raw = typeof value === 'number' ? String(value) : String(value ?? '');
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new BadRequestException(`Missing ${fieldName}`);
  }
  try {
    return BigInt(trimmed);
  } catch {
    throw new BadRequestException(`Invalid ${fieldName}`);
  }
}
