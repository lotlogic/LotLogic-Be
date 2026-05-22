import { BadRequestException } from '@nestjs/common';

export const ENQUIRY_JOURNEY_TYPES = [
  'secure_block',
  'pricing_enquiry',
] as const;

export const ENQUIRY_FINISHES_LEVELS = ['low', 'medium', 'high'] as const;

export type EnquiryJourneyType = (typeof ENQUIRY_JOURNEY_TYPES)[number];
export type EnquiryFinishesLevel = (typeof ENQUIRY_FINISHES_LEVELS)[number];

export const normalizeEnquiryJourneyType = (
  value: unknown,
): EnquiryJourneyType | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return ENQUIRY_JOURNEY_TYPES.includes(normalized as EnquiryJourneyType)
    ? (normalized as EnquiryJourneyType)
    : null;
};

export const normalizeEnquiryJourneyTypeOrThrow = (
  value: unknown,
  fieldName = 'journeyType',
): EnquiryJourneyType | null => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null;
  }

  const normalized = normalizeEnquiryJourneyType(value);
  if (normalized) {
    return normalized;
  }

  throw new BadRequestException(
    `Invalid ${fieldName}. Expected one of: ${ENQUIRY_JOURNEY_TYPES.join(', ')}.`,
  );
};

export const normalizeEnquiryFinishesLevel = (
  value: unknown,
): EnquiryFinishesLevel | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return ENQUIRY_FINISHES_LEVELS.includes(normalized as EnquiryFinishesLevel)
    ? (normalized as EnquiryFinishesLevel)
    : null;
};

export const normalizeEnquiryFinishesLevelOrThrow = (
  value: unknown,
  fieldName = 'finishesLevel',
): EnquiryFinishesLevel | null => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null;
  }

  const normalized = normalizeEnquiryFinishesLevel(value);
  if (normalized) {
    return normalized;
  }

  throw new BadRequestException(
    `Invalid ${fieldName}. Expected one of: ${ENQUIRY_FINISHES_LEVELS.join(', ')}.`,
  );
};
