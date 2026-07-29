# LotLogic Backend

Shared NestJS backend for the LotCheck platform and BlockPlanner tools. The
service retains the original LotLogic APIs for estates, lots, builders, plans,
enquiries, zoning and administration while also providing shared Stripe,
monday.com, geocoding and report-delivery services for BlockPlanner.

The production API is hosted in Azure Container Apps:

`https://lotcheck-be.wittysky-d6d60dbd.australiasoutheast.azurecontainerapps.io/api`

## Architecture

- Node.js 20 and NestJS 11
- PostgreSQL with PostGIS
- Prisma ORM and migrations
- Stripe Checkout in live and sandbox modes
- monday.com boards for paid fulfillment and submitted leads
- Azure Blob Storage and Chromium for generated PDF reports
- Google Geocoding and imported ACT spatial data for address and zone lookup
- Docker for local development and production images

All application routes use the `/api` prefix. `GET /api/health` can be used for
a basic health check.

### Shared BlockPlanner flows

The backend supports these paid product codes:

| `productCode` | Product | Fulfillment mapping |
| --- | --- | --- |
| `site_report` | BlockPlanner Site Assessment Report | `site_report` |
| `crown_lease` | Crown Lease Service | `crown_lease` |
| `feasibility_report` | Financial Feasibility Report | `feasibility_report` |

Supported source applications are:

- `discover`
- `lvc_estimator`
- `upgrade_estimator`
- `legacy`, retained for older callers

The paid flow does not maintain a separate orders database:

1. A frontend calls `POST /api/stripe/create-checkout-session`.
2. The backend validates the product, source application, trusted site and
   cancel URL.
3. Stripe Checkout stores the report and customer fields as metadata.
4. A signed Stripe webhook confirms that the payment is paid.
5. The backend creates or updates the relevant monday.com item.

monday.com upserts use the Stripe Payment Intent ID first and the generated
report ID second. This prevents duplicate fulfillment when Stripe retries a
webhook.

### Backward compatibility

The service remains compatible with existing LotCheck and older Discover
callers:

- Existing non-BlockPlanner controllers and database models are unchanged.
- `productCode` defaults to `site_report`.
- `email` remains accepted as an alias for `clientEmail`.
- `sourceApp` can be inferred from known canonical paths and legacy
  subdomains when it is omitted.
- Existing apex URLs, `www` tool URLs, legacy tool subdomains and localhost
  development URLs are accepted.
- Checkout remains live by default unless a source-specific server override
  or an explicit valid `checkoutMode` selects sandbox.

New clients should always send an explicit `productCode` and `sourceApp`.

## Configuration

Copy `.env-example` to `.env` for local development and supply the required
values. Never commit `.env`, API tokens, signing secrets, SMTP credentials,
database credentials or Azure connection strings.

Configuration is deliberately split between versioned JSON and secret
environment variables.

### Product catalog

`src/config/blockplanner-products.json` contains the supported product display
names, AUD amounts, and live and sandbox Stripe Price IDs.

Update this file when a product price changes. Stripe secret keys do not belong
in this file.

The catalog is validated at application startup. Unknown products, missing
products and malformed Price IDs cause startup or checkout to fail rather than
silently using the wrong product.

### monday.com mappings

`src/config/blockplanner-monday-workflows.json` contains the board IDs, group
IDs, column IDs and status-label mappings used by the BlockPlanner workflows.
It currently maps:

- site reports
- Crown lease purchases
- feasibility reports
- LVC estimator leads
- upgrade report leads
- contact requests
- free assessment leads

Board and column mappings belong in this file, not in a large collection of
environment variables. `MONDAY_API_TOKEN` remains an environment secret.
Changes to a monday.com board must be reflected in the JSON mapping before the
corresponding workflow is deployed.

### Required service credentials

Use `.env-example` as the baseline variable template. The main integration
groups are:

- Database: `DATABASE_URL`
- Stripe live: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- Stripe sandbox: `STRIPE_SANDBOX_API_KEY`,
  `STRIPE_SANDBOX_WEBHOOK_SECRET`
- monday.com: `MONDAY_API_TOKEN`
- Mail: `SMTP_*`, with optional `LOTCHECK_SMTP_*` overrides
- Geocoding: `GOOGLE_MAPS_API_KEY`
- Generated reports: `AZURE_STORAGE_CONNECTION_STRING`,
  `AZURE_STORAGE_CONTAINER` and a Chromium executable path where required
- Microsoft Entra invitations: `ENTRA_*` or `AZURE_TENANT_ID`
- Mixpanel reporting: `MIXPANEL_*`

The Azure Container App owns production runtime secrets. The deployment
workflow does not replace the full environment on each release.

## Stripe Checkout

Create a hosted checkout session with:

```http
POST /api/stripe/create-checkout-session
Content-Type: application/json
```

Example request:

```json
{
  "site": "https://www.blockplanner.com.au/tools/discover",
  "cancelUrl": "https://www.blockplanner.com.au/tools/discover/assessment",
  "checkoutMode": "live",
  "productCode": "site_report",
  "sourceApp": "discover",
  "clientName": "Example Customer",
  "clientEmail": "customer@example.com",
  "clientPhone": "+61 400 000 000",
  "address": "Example address",
  "suburb": "EXAMPLE",
  "blockSizeM2": 800,
  "zone": "RZ1",
  "intention": "Sell"
}
```

`site`, `clientEmail` and `address` are required. The response contains the
Stripe-hosted checkout URL.

### Site allowlisting and return URLs

Each non-legacy `sourceApp` has a fixed list of accepted production URLs.
Optional `BLOCKPLANNER_*_SITE_URL` values can add a trusted deployment URL for
each frontend.

The backend:

- accepts only HTTP or HTTPS site URLs
- rejects query strings and fragments on `site`
- requires `cancelUrl` to use the same origin as `site`
- requires canonical-path cancel URLs to remain inside that tool's path
- builds the success URL under the validated site path

Do not use `legacy` for new integrations. It exists only to avoid breaking
older callers that predate source-specific allowlisting.

### Live and sandbox behavior

`checkoutMode` accepts `live` or `sandbox`. Existing callers default to live.
The server can override a frontend's requested mode with:

- `STRIPE_DISCOVER_CHECKOUT_MODE`
- `STRIPE_LVC_CHECKOUT_MODE`
- `STRIPE_UPGRADE_CHECKOUT_MODE`

This permits unreleased frontends to run end to end in Stripe test mode while
production Discover remains live. Confirm these values in the Azure Container
App before promoting a frontend.

Sandbox mode requires both the sandbox API key and the sandbox Price ID for the
selected product. Sandbox monday.com item names are prefixed with `[SANDBOX]`.

### Stripe webhook

Configure Stripe live mode and test mode to send relevant Checkout and Payment
Intent events to:

```text
POST /api/stripe/webhook
```

The endpoint requires Stripe's unmodified raw body and `stripe-signature`
header. NestJS raw-body support is enabled in `src/main.ts`.

The backend attempts verification with the configured live and sandbox webhook
secrets, confirms that the event mode matches the secret, and ignores unpaid
Checkout Sessions. Fulfillment is handled for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `payment_intent.succeeded`

Stripe can deliver more than one relevant event for a payment, so the
monday.com upsert behavior is required for idempotency.

## monday.com Endpoints

Frontend lead submission endpoints:

```text
POST /api/monday/free-assessment-leads
POST /api/monday/product-leads
```

Supported `leadType` values for product leads are `lvc_estimator`,
`upgrade_report` and `contact_request`.

`POST /api/enquiry/get-in-touch` is retained for existing Discover callers. If
the `contact_request` workflow is configured, it writes the enquiry to
monday.com. Otherwise it falls back to the configured email recipient. The
endpoint validates required contact fields, uses a honeypot field, and verifies
reCAPTCHA when `RECAPTCHA_SECRET_KEY` is configured.

Report automation endpoints:

```text
POST /api/monday/dashboard-trigger
POST /api/monday/dashboard-delivery
```

Both report endpoints support monday.com's initial `challenge` request. For
normal requests they extract the monday.com item ID, load the mapped item and
then queue report generation or delivery.

Set `MONDAY_WEBHOOK_SECRET` in every non-local environment. Supply it using the
`x-webhook-secret` header where the caller permits custom headers. Query-string
and request-body secret forms are retained for integrations that cannot set
headers, but URLs containing secrets must not be logged or shared.

Report generation additionally requires Azure Blob Storage and Chromium.
Report delivery requires valid mail configuration and a populated final PDF
link and client email in monday.com.

## Local Development

### Prerequisites

- Node.js 20
- npm
- PostgreSQL with PostGIS, or Docker Desktop with Docker Compose

### Native application with a local database

```bash
npm ci
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

The API listens on `http://localhost:3000/api` unless `PORT` is changed.

### Docker Compose

```bash
docker compose up --build
```

The local stack exposes:

| Service | URL or port |
| --- | --- |
| Backend | `http://localhost:3000/api` |
| PostgreSQL/PostGIS | `localhost:5432` |
| pgAdmin | `http://localhost:5050` |

`docker-compose.yml` is a development convenience file, not a production
configuration. Replace all local credentials with developer-specific values
and never reuse them in a hosted environment.

### Available commands

These are the scripts currently defined in `package.json`:

```bash
npm run start
npm run start:dev
npm run start:debug
npm run build
npm run test:stripe-checkout
npm run format
```

`npm run format` modifies TypeScript files. Run it only when formatting changes
are intended. There is currently no general `lint` or full test-suite script.

Useful Prisma commands:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

## ACT Spatial Data

The zone endpoint supports lookup by address or coordinates:

```text
GET /api/geo/act-zone?address=1%20Bunda%20St%20Canberra%20ACT
GET /api/geo/act-zone?lat=-35.2809&lng=149.1310
```

ACT block and land-use-zone GeoJSON can be imported into PostGIS with:

```bash
npx tsx prisma/seeds/actLandUseZone.ts --skip-if-exists
npx tsx prisma/seeds/actBlock.ts --skip-if-exists
```

Use `--truncate` only when a full replacement is intended.

The production runtime image intentionally excludes the large GeoJSON files.
`AUTO_IMPORT_ACT_DATA` is therefore disabled by the production deployment
workflow unless the runtime is separately provided with import files.

## Security and Operations

- Keep all secrets in local `.env`, GitHub Actions secrets or Azure Container
  App secrets. Versioned JSON contains identifiers and mappings only.
- Stripe webhook signing is mandatory. Never fulfill an order from the browser
  return URL.
- Set `MONDAY_WEBHOOK_SECRET` in production. monday.com's challenge handshake
  is the only request handled before normal secret verification.
- CORS is not authentication. Protect administrative routes with the existing
  Azure and application authorization controls.
- Leave `STRIPE_WEBHOOK_LOG_PAYLOAD` disabled in production. Payload logs can
  contain customer information.
- Do not expose Stripe secret keys, monday.com tokens, SMTP credentials,
  database URLs or Azure storage connection strings to frontend builds.
- Preserve `productCode`, `sourceApp`, report ID and Stripe payment ID metadata
  when adding a new paid frontend.
- Add a product to the TypeScript supported-code list, product JSON, monday.com
  JSON mapping and checkout tests as one change.

## Production Deployment

`.github/workflows/deploy-azure-acr-prod.yml` runs on every push to `main` and
can also be started manually.

The workflow:

1. Builds `Dockerfile.runtime` with Docker Buildx.
2. Pushes SHA-tagged and `prod-latest` images to
   `lotcheck.azurecr.io/lotlogic-be`.
3. Authenticates to Azure.
4. Deploys the immutable SHA-tagged image to the `lotcheck-be` Container App in
   the `Production` resource group.
5. Enables automatic Prisma migrations and disables automatic seed and ACT
   data imports.

Required GitHub Actions secrets are:

- `ACR_USERNAME`
- `ACR_PASSWORD`
- `AZURE_CREDENTIALS`
- `PROD_DATABASE_URL`, optional when the Container App already owns the correct
  database setting

The runtime image includes Chromium for PDF generation, runs
`npx prisma migrate deploy` through `scripts/runtime-entrypoint.sh`, and starts
`dist/src/main.js`.

Before pushing to `main`, run:

```bash
npm run test:stripe-checkout
npm run build
```

After deployment, verify `/api/health`, one trusted checkout request in the
intended mode, Stripe webhook delivery, and the corresponding monday.com item.

## Repository Notes

This is a private, unlicensed repository. Coordinate changes to shared
controllers and deployment configuration because a release can affect both
LotCheck and all BlockPlanner frontends.
