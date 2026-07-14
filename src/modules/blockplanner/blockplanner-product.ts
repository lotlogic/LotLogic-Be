export const BLOCKPLANNER_PAID_PRODUCT_CODES = [
  'site_report',
  'crown_lease',
  'feasibility_report',
] as const;

export type BlockplannerPaidProductCode =
  (typeof BLOCKPLANNER_PAID_PRODUCT_CODES)[number];

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
  livePriceEnv: string;
  sandboxPriceEnv: string;
};

export const BLOCKPLANNER_PAID_PRODUCTS: Record<
  BlockplannerPaidProductCode,
  BlockplannerPaidProductDefinition
> = {
  site_report: {
    code: 'site_report',
    displayName: 'Full site report',
    livePriceEnv: 'STRIPE_SITE_REPORT_PRICE_ID',
    sandboxPriceEnv: 'STRIPE_SANDBOX_SITE_REPORT_PRICE_ID',
  },
  crown_lease: {
    code: 'crown_lease',
    displayName: 'Crown lease purchase',
    livePriceEnv: 'STRIPE_CROWN_LEASE_PRICE_ID',
    sandboxPriceEnv: 'STRIPE_SANDBOX_CROWN_LEASE_PRICE_ID',
  },
  feasibility_report: {
    code: 'feasibility_report',
    displayName: 'Feasibility report',
    livePriceEnv: 'STRIPE_FEASIBILITY_REPORT_PRICE_ID',
    sandboxPriceEnv: 'STRIPE_SANDBOX_FEASIBILITY_REPORT_PRICE_ID',
  },
};

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
  'upgrade_report',
  'contact_request',
] as const;

export type BlockplannerLeadType = (typeof BLOCKPLANNER_LEAD_TYPES)[number];

export function isBlockplannerLeadType(
  value: string,
): value is BlockplannerLeadType {
  return BLOCKPLANNER_LEAD_TYPES.includes(value as BlockplannerLeadType);
}
