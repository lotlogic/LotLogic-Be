import { BadRequestException } from '@nestjs/common';

export const LOT_SALES_MODES = ['land_sale', 'house_and_land'] as const;

export type LotSalesMode = (typeof LOT_SALES_MODES)[number];

const SALES_MODE_LABELS: Record<LotSalesMode, string> = {
  land_sale: 'Land sale',
  house_and_land: 'House & land',
};

export const normalizeLotSalesMode = (value: unknown): LotSalesMode | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return LOT_SALES_MODES.includes(normalized as LotSalesMode)
    ? (normalized as LotSalesMode)
    : null;
};

export const normalizeLotSalesModeOrThrow = (
  value: unknown,
  fieldName = 'salesMode',
) : LotSalesMode => {
  if (value === undefined || value === null) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Expected one of: ${LOT_SALES_MODES.join(', ')}.`,
    );
  }

  const normalized = normalizeLotSalesMode(value);
  if (normalized) {
    return normalized;
  }

  throw new BadRequestException(
    `Invalid ${fieldName}. Expected one of: ${LOT_SALES_MODES.join(', ')}.`,
  );
};

export const getLotSalesModeLabel = (value: unknown): string => {
  const normalized = normalizeLotSalesMode(value);
  return normalized ? SALES_MODE_LABELS[normalized] : 'Unknown';
};
