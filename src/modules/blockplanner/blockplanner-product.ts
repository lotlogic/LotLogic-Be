import { readFileSync } from 'fs';
import { join } from 'path';

export const BLOCKPLANNER_PAID_PRODUCT_CODES = [
  'site_report',
  'crown_lease',
  'feasibility_report',
] as const;

export type BlockplannerPaidProductCode =
  (typeof BLOCKPLANNER_PAID_PRODUCT_CODES)[number];

export type BlockplannerCheckoutMode = 'live' | 'sandbox';

export const BLOCKPLANNER_SOURCE_APPS = [
  'discover',
  'lvc_estimator',
  'upgrade_estimator',
  'legacy',
] as const;

export type BlockplannerSourceApp = (typeof BLOCKPLANNER_SOURCE_APPS)[number];

export type BlockplannerPaidProductDefinition = {
  code: BlockplannerPaidProductCode;
  displayName: string;
  amountAud: number;
  prices: Record<BlockplannerCheckoutMode, string>;
};

const BLOCKPLANNER_PRODUCTS_FILE = join(
  __dirname,
  '..',
  '..',
  'config',
  'blockplanner-products.json',
);
const STRIPE_PRICE_ID_PATTERN = /^price_[A-Za-z0-9]+$/;
let paidProductCatalog: Record<
  BlockplannerPaidProductCode,
  BlockplannerPaidProductDefinition
> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parsePriceId(
  value: unknown,
  productCode: BlockplannerPaidProductCode,
  mode: BlockplannerCheckoutMode,
): string {
  const priceId = typeof value === 'string' ? value.trim() : '';
  if (!STRIPE_PRICE_ID_PATTERN.test(priceId)) {
    throw new Error(
      `Invalid ${mode} Price ID for ${productCode} in blockplanner-products.json`,
    );
  }
  return priceId;
}

function loadPaidProductCatalog(): Record<
  BlockplannerPaidProductCode,
  BlockplannerPaidProductDefinition
> {
  if (paidProductCatalog) return paidProductCatalog;

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(BLOCKPLANNER_PRODUCTS_FILE, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to load blockplanner-products.json: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!isRecord(parsed)) {
    throw new Error('blockplanner-products.json must contain a JSON object');
  }

  const supportedCodes = new Set<string>(BLOCKPLANNER_PAID_PRODUCT_CODES);
  const unsupportedCodes = Object.keys(parsed).filter(
    (code) => !supportedCodes.has(code),
  );
  if (unsupportedCodes.length) {
    throw new Error(
      `Unsupported product(s) in blockplanner-products.json: ${unsupportedCodes.join(', ')}`,
    );
  }

  const catalog = {} as Record<
    BlockplannerPaidProductCode,
    BlockplannerPaidProductDefinition
  >;
  for (const code of BLOCKPLANNER_PAID_PRODUCT_CODES) {
    const value = parsed[code];
    if (!isRecord(value) || !isRecord(value.prices)) {
      throw new Error(`Missing product configuration for ${code}`);
    }

    const displayName =
      typeof value.displayName === 'string' ? value.displayName.trim() : '';
    const amountAud = Number(value.amountAud);
    if (!displayName) {
      throw new Error(`Missing displayName for ${code}`);
    }
    if (!Number.isFinite(amountAud) || amountAud <= 0) {
      throw new Error(`Invalid amountAud for ${code}`);
    }

    catalog[code] = {
      code,
      displayName,
      amountAud,
      prices: {
        live: parsePriceId(value.prices.live, code, 'live'),
        sandbox: parsePriceId(value.prices.sandbox, code, 'sandbox'),
      },
    };
  }

  paidProductCatalog = catalog;
  return catalog;
}

export function getBlockplannerPaidProduct(
  productCode: BlockplannerPaidProductCode,
): BlockplannerPaidProductDefinition {
  return loadPaidProductCatalog()[productCode];
}

export function isBlockplannerPaidProductCode(
  value: string,
): value is BlockplannerPaidProductCode {
  return BLOCKPLANNER_PAID_PRODUCT_CODES.includes(
    value as BlockplannerPaidProductCode,
  );
}

export function isBlockplannerSourceApp(
  value: string,
): value is BlockplannerSourceApp {
  return BLOCKPLANNER_SOURCE_APPS.includes(value as BlockplannerSourceApp);
}

export const BLOCKPLANNER_LEAD_TYPES = [
  'lvc_estimator',
  'upgrade_report',
  'contact_request',
] as const;

export type BlockplannerLeadType = (typeof BLOCKPLANNER_LEAD_TYPES)[number];

export function isBlockplannerLeadType(
  value: string,
): value is BlockplannerLeadType {
  return BLOCKPLANNER_LEAD_TYPES.includes(value as BlockplannerLeadType);
}
