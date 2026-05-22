import { BadRequestException } from '@nestjs/common';

export const LOT_LIFECYCLE_STAGES = ['available', 'reserved', 'sold'] as const;

export type LotLifecycleStage = (typeof LOT_LIFECYCLE_STAGES)[number];

const LEGACY_LIFECYCLE_ALIASES: Record<string, LotLifecycleStage> = {
  unavailable: 'reserved',
};

const normalizeLifecycleText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

export const normalizeLotLifecycleStage = (value: unknown): LotLifecycleStage | null => {
  const normalized = normalizeLifecycleText(value);
  if (!normalized) {
    return null;
  }

  if (normalized in LEGACY_LIFECYCLE_ALIASES) {
    return LEGACY_LIFECYCLE_ALIASES[normalized];
  }

  return LOT_LIFECYCLE_STAGES.includes(normalized as LotLifecycleStage)
    ? (normalized as LotLifecycleStage)
    : null;
};

export const normalizeLotLifecycleStageOrThrow = (
  value: unknown,
  fieldName = 'lifecycleStage',
): LotLifecycleStage | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = normalizeLotLifecycleStage(value);
  if (normalized) {
    return normalized;
  }

  throw new BadRequestException(
    `Invalid ${fieldName}. Expected one of: ${LOT_LIFECYCLE_STAGES.join(', ')}.`,
  );
};

export const isAvailableLotLifecycleStage = (value: unknown): boolean =>
  normalizeLotLifecycleStage(value) === 'available';
