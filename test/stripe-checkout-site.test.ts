import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { StripeController } from '../src/modules/stripe/stripe.controller';

const SITE_ENV_KEYS = [
  'BLOCKPLANNER_DISCOVER_SITE_URL',
  'BLOCKPLANNER_LVC_SITE_URL',
  'BLOCKPLANNER_UPGRADE_SITE_URL',
] as const;

describe('Stripe checkout site handling', () => {
  let controller: StripeController;
  let originalSiteEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalSiteEnv = Object.fromEntries(
      SITE_ENV_KEYS.map((key) => [key, process.env[key]]),
    );
    for (const key of SITE_ENV_KEYS) delete process.env[key];

    controller = new StripeController({} as never, {} as never);
  });

  afterEach(() => {
    for (const key of SITE_ENV_KEYS) {
      const originalValue = originalSiteEnv[key];
      if (originalValue === undefined) delete process.env[key];
      else process.env[key] = originalValue;
    }
  });

  const callPrivate = <T>(method: string, ...args: unknown[]): T =>
    (
      controller as unknown as Record<
        string,
        (...methodArgs: unknown[]) => unknown
      >
    )[method](...args) as T;

  it('infers source apps from both legacy subdomains and canonical paths', () => {
    assert.equal(
      callPrivate(
        'parseSourceApp',
        undefined,
        'https://discover.blockplanner.com.au',
      ),
      'discover',
    );
    assert.equal(
      callPrivate(
        'parseSourceApp',
        undefined,
        'https://blockplanner.com.au/tools/discover/',
      ),
      'discover',
    );
    assert.equal(
      callPrivate(
        'parseSourceApp',
        undefined,
        'https://blockplanner.com.au/tools/lvc-estimator',
      ),
      'lvc_estimator',
    );
    assert.equal(
      callPrivate(
        'parseSourceApp',
        undefined,
        'https://blockplanner.com.au/tools/upgrade',
      ),
      'upgrade_estimator',
    );
  });

  it('allows the legacy subdomains and canonical app roots', () => {
    assert.equal(
      callPrivate(
        'resolveCheckoutSite',
        'discover',
        'https://discover.blockplanner.com.au/',
      ),
      'https://discover.blockplanner.com.au',
    );
    assert.equal(
      callPrivate(
        'resolveCheckoutSite',
        'discover',
        'https://blockplanner.com.au/tools/discover/',
      ),
      'https://blockplanner.com.au/tools/discover',
    );
    assert.equal(
      callPrivate(
        'resolveCheckoutSite',
        'lvc_estimator',
        'https://blockplanner.com.au/tools/lvc-estimator',
      ),
      'https://blockplanner.com.au/tools/lvc-estimator',
    );
    assert.equal(
      callPrivate(
        'resolveCheckoutSite',
        'upgrade_estimator',
        'https://blockplanner.com.au/tools/upgrade',
      ),
      'https://blockplanner.com.au/tools/upgrade',
    );
  });

  it('rejects unapproved app roots and URL state in site', () => {
    assert.throws(
      () =>
        callPrivate(
          'resolveCheckoutSite',
          'discover',
          'https://blockplanner.com.au/tools/lvc-estimator',
        ),
      BadRequestException,
    );
    assert.throws(
      () =>
        callPrivate(
          'resolveCheckoutSite',
          'discover',
          'https://blockplanner.com.au/tools/discover/checkout',
        ),
      BadRequestException,
    );
    assert.throws(
      () =>
        callPrivate(
          'resolveCheckoutSite',
          'discover',
          'https://blockplanner.com.au/tools/discover?redirect=elsewhere',
        ),
      BadRequestException,
    );
  });

  it('keeps canonical cancellation URLs inside the approved app path', () => {
    const site = 'https://blockplanner.com.au/tools/discover';

    assert.equal(
      callPrivate(
        'resolveCheckoutCancelUrl',
        site,
        'https://blockplanner.com.au/tools/discover/assessment?step=results',
      ),
      'https://blockplanner.com.au/tools/discover/assessment?step=results',
    );
    assert.throws(
      () =>
        callPrivate(
          'resolveCheckoutCancelUrl',
          site,
          'https://blockplanner.com.au/',
        ),
      BadRequestException,
    );
    assert.throws(
      () =>
        callPrivate(
          'resolveCheckoutCancelUrl',
          site,
          'https://blockplanner.com.au/tools/upgrade',
        ),
      BadRequestException,
    );
  });

  it('preserves root-site, localhost, and legacy behavior', () => {
    assert.equal(
      callPrivate(
        'resolveCheckoutCancelUrl',
        'https://discover.blockplanner.com.au',
        'https://discover.blockplanner.com.au/assessment?step=results',
      ),
      'https://discover.blockplanner.com.au/assessment?step=results',
    );
    assert.equal(
      callPrivate(
        'resolveCheckoutSite',
        'discover',
        'http://localhost:5173/tools/discover',
      ),
      'http://localhost:5173',
    );
    assert.equal(
      callPrivate(
        'resolveCheckoutSite',
        'legacy',
        'https://legacy.example.com/report?ignored=true',
      ),
      'https://legacy.example.com',
    );
  });
});
