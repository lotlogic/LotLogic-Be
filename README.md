# LotLogic Backend

Shared NestJS backend for LotCheck and the BlockPlanner property tools.

The service preserves the existing LotLogic APIs for estates, lots, builders,
plans, enquiries, zoning and administration. It also provides BlockPlanner
with shared address and zone lookup, Stripe Checkout, monday.com fulfillment,
lead capture, report generation and report delivery.

Production API base URL:

```text
https://lotcheck-be.wittysky-d6d60dbd.australiasoutheast.azurecontainerapps.io/api
```

All application routes use the `/api` prefix. Use `GET /api/health` for a basic
service health check.

## Operating Architecture

The backend is one shared service rather than a separate API per frontend.

It supports:

- existing LotCheck clients and administrative workflows
- BlockPlanner Discover at `https://www.blockplanner.com.au/tools/discover`
- the LVC estimator at
  `https://www.blockplanner.com.au/tools/lvc-estimator`
- the Upgrade tool at `https://www.blockplanner.com.au/tools/upgrade`
- legacy BlockPlanner subdomains while clients and redirects are migrated

The main runtime components are:

- Node.js 20 and NestJS 11
- PostgreSQL with PostGIS
- Prisma ORM and migrations
- Stripe Checkout in live and sandbox modes
- monday.com boards for paid fulfillment and submitted leads
- Azure Blob Storage and Chromium for generated PDF reports
- Google Geocoding and imported ACT spatial data
- Azure Container Registry and Azure Container Apps

### Paid order flow

The paid BlockPlanner flow uses Stripe and monday.com as the order and
fulfillment records. It does not require a separate application orders table.

1. A trusted frontend calls
   `POST /api/stripe/create-checkout-session`.
2. The backend validates `productCode`, `sourceApp`, `site`, `cancelUrl` and
   checkout mode.
3. Stripe Checkout stores the order and customer data in session metadata.
4. Stripe sends a signed webhook after successful payment.
5. The backend verifies the webhook signature and confirms the payment state.
6. The backend creates or updates the mapped monday.com item.
7. monday.com manages the operational fulfillment workflow.

Browser success and cancel pages are user experience routes only. They never
authorize fulfillment.

### Paid products

The supported product catalog is defined in
`src/config/blockplanner-products.json`.

| `productCode` | Product | Price |
| --- | --- | ---: |
| `site_report` | BlockPlanner Site Assessment Report | AUD 299 |
| `crown_lease` | Crown Lease Service | AUD 149 |
| `feasibility_report` | Financial Feasibility Report | AUD 1,200 |

Each product has a live Stripe Price ID and a sandbox Stripe Price ID in the
catalog. Stripe API keys and webhook signing secrets remain environment
secrets.

### Source applications

New checkout integrations must send an explicit `sourceApp`:

- `discover`
- `lvc_estimator`
- `upgrade_estimator`

`legacy` is retained only for older callers. New frontends must not use it.

The backend can infer a source application from the canonical BlockPlanner
tool paths, legacy tool subdomains and known local development URLs when an
older caller omits `sourceApp`.

## Backward Compatibility

Changes to this service must preserve LotCheck and existing Discover behavior.

The compatibility contract includes:

- existing non-BlockPlanner controllers and Prisma models remain available
- omitted `productCode` defaults to `site_report`
- `email` remains accepted as an alias for `clientEmail`
- omitted `sourceApp` is inferred from a recognized frontend URL where
  possible
- canonical `www` URLs, apex tool URLs, legacy tool subdomains and localhost
  development URLs remain accepted
- checkout defaults to live unless an explicit valid mode or a server-side
  source override selects sandbox

Any shared controller, CORS, database or deployment change must be tested
against both LotCheck and BlockPlanner consumers.

## Configuration

Copy `.env-example` to `.env` for local development and provide the required
values.

```bash
cp .env-example .env
```

On Windows, copy the file using Explorer or PowerShell instead.

Configuration is split by responsibility:

- versioned product data:
  `src/config/blockplanner-products.json`
- versioned monday.com board mappings:
  `src/config/blockplanner-monday-workflows.json`
- secrets and environment-specific behavior: environment variables

Do not move API tokens, private keys, signing secrets, SMTP credentials,
database credentials or Azure connection strings into the JSON files.

### Core runtime

The production runtime requires an external PostgreSQL database:

```text
DATABASE_URL
```

Runtime startup behavior is controlled by:

```text
AUTO_MIGRATE
AUTO_SEED
AUTO_SEED_SKIP_IF_DATA
AUTO_IMPORT_ACT_DATA
```

Production enables migrations and disables automatic seed and ACT data
imports.

### Stripe configuration

Live Stripe configuration:

```text
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
```

Sandbox Stripe configuration:

```text
STRIPE_SANDBOX_API_KEY
STRIPE_SANDBOX_WEBHOOK_SECRET
```

Per-frontend mode overrides:

```text
STRIPE_DISCOVER_CHECKOUT_MODE
STRIPE_LVC_CHECKOUT_MODE
STRIPE_UPGRADE_CHECKOUT_MODE
```

Each override accepts `live` or `sandbox`. When an override is set, it takes
precedence over the mode requested by that frontend. This allows unreleased
tools to use Stripe test mode without moving production Discover out of live
mode.

Trusted production URL overrides:

```text
BLOCKPLANNER_DISCOVER_SITE_URL
BLOCKPLANNER_LVC_SITE_URL
BLOCKPLANNER_UPGRADE_SITE_URL
```

The built-in allowlist already contains canonical BlockPlanner paths, apex
paths and legacy subdomains. These variables add an environment-specific
trusted URL and do not replace input validation.

### monday.com

The monday.com API credential is supplied through:

```text
MONDAY_API_TOKEN
```

Optional API endpoint and version overrides are documented in `.env-example`.

`src/config/blockplanner-monday-workflows.json` owns all BlockPlanner board,
group, column and status-label mappings. It covers:

- paid site reports
- Crown lease purchases
- feasibility reports
- LVC estimator leads
- Upgrade report leads
- contact requests
- free assessment leads

Board schema changes must be applied to monday.com and this JSON mapping as one
coordinated release. Board and column IDs must not be expanded into individual
environment variables.

Paid webhook fulfillment is idempotent. The backend searches for an existing
item by Stripe Payment Intent ID first and generated report ID second, then
updates that item instead of creating a duplicate. Ordinary lead submissions
create new items and do not use the paid-order idempotency rule.

### Other integrations

Use `.env-example` as the authoritative variable template for:

- SMTP and optional LotCheck-specific SMTP settings
- Google Maps geocoding
- Azure Blob Storage and report uploads
- Chromium or Puppeteer executable paths
- Microsoft Entra invitations
- Mixpanel reporting
- monday.com report generation and delivery

Production secrets belong in Azure Container App secret-backed environment
variables. GitHub Actions secrets are used only where the deployment workflow
needs them.

## Stripe Checkout API

Create a hosted checkout session:

```http
POST /api/stripe/create-checkout-session
Content-Type: application/json
```

Example:

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

`site`, customer email and address are required. The response contains the
Stripe-hosted checkout URL.

### Trusted site and return URL rules

For non-legacy callers, the backend:

- accepts only HTTP and HTTPS site URLs
- rejects query strings and fragments on `site`
- requires `site` to match the selected `sourceApp`
- requires `cancelUrl` to use the same origin as `site`
- requires canonical-path cancel URLs to remain within the selected tool path
- creates the success URL beneath the validated tool path

Do not accept arbitrary frontend-provided return origins. Add a legitimate new
frontend to the typed source list, trusted URL rules and regression tests.

### Live and sandbox behavior

The selected checkout mode controls all three Stripe values:

- API key
- product Price ID
- webhook signing secret used to verify the resulting event

Sandbox mode requires the sandbox API key and the selected product's sandbox
Price ID. Sandbox monday.com item names are prefixed with `[SANDBOX]`.

Before releasing a tool, confirm its server-side mode override in the Azure
Container App. Do not infer production mode from a local frontend setting.

## Webhooks

### Stripe payment webhook

Configure both Stripe live mode and Stripe test mode to send supported payment
events to:

```text
POST /api/stripe/webhook
```

The endpoint requires Stripe's unmodified raw request body and
`stripe-signature` header. NestJS raw-body support is enabled in `src/main.ts`.

The backend:

- attempts verification against configured live and sandbox secrets
- confirms that the Stripe event mode matches the secret used
- ignores unpaid or irrelevant events
- extracts the paid product metadata
- performs an idempotent monday.com upsert

Supported fulfillment events include:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `payment_intent.succeeded`

Stripe can send more than one supported event for one payment. The monday.com
upsert must remain in place.

### monday.com report automation

Report automation endpoints:

```text
POST /api/monday/dashboard-trigger
POST /api/monday/dashboard-delivery
```

Both endpoints support monday.com's initial challenge request. Normal webhook
requests require the configured shared secret:

```text
MONDAY_WEBHOOK_SECRET
```

Prefer the `x-webhook-secret` header. Query-string and request-body forms exist
for integrations that cannot set a custom header, but secret-bearing URLs must
not be logged, shared or stored in analytics.

Report generation also requires Azure Blob Storage and Chromium. Delivery
requires mail configuration, a final PDF link and a client email in monday.com.

## Lead Capture

Frontend lead endpoints:

```text
POST /api/monday/free-assessment-leads
POST /api/monday/product-leads
```

Supported product lead types:

- `lvc_estimator`
- `upgrade_report`
- `contact_request`

`POST /api/enquiry/get-in-touch` remains available for existing Discover
callers. When the `contact_request` monday.com mapping is configured, it
creates the monday.com item. Email is retained as a compatibility fallback
when that workflow is unavailable.

## Local Development

### Prerequisites

- Node.js 20
- npm
- PostgreSQL with PostGIS
- Docker Desktop, if using Docker Compose

### Native development

```bash
npm ci
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

The default local API URL is `http://localhost:3000/api`.

### Docker Compose

```bash
docker compose up --build
```

The development stack exposes:

| Service | URL or port |
| --- | --- |
| Backend | `http://localhost:3000/api` |
| PostgreSQL/PostGIS | `localhost:5432` |
| pgAdmin | `http://localhost:5050` |

`docker-compose.yml` is for isolated local development only. It is not a
production deployment definition. Use non-production credentials, keep the
services off public interfaces, and never reuse local database or pgAdmin
credentials in Azure.

### Package scripts

The scripts defined in `package.json` are:

```bash
npm run build
npm run format
npm run test:stripe-checkout
npm run start
npm run start:dev
npm run start:debug
npm run start:prod
```

`npm run format` writes changes to TypeScript files. There is no general lint
script or full test-suite script.

The production container does not rely on `npm run start:prod`.
`scripts/runtime-entrypoint.sh` starts the compiled application at
`dist/src/main.js` after its migration and optional seed steps.

Useful Prisma commands:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio
```

## ACT Spatial Data

Zone lookup accepts an address or coordinates:

```text
GET /api/geo/act-zone?address=1%20Bunda%20St%20Canberra%20ACT
GET /api/geo/act-zone?lat=-35.2809&lng=149.1310
```

ACT block and land-use-zone GeoJSON can be imported into PostGIS with:

```bash
npx tsx prisma/seeds/actLandUseZone.ts --skip-if-exists
npx tsx prisma/seeds/actBlock.ts --skip-if-exists
```

Use `--truncate` only for an intentional full replacement.

The production image excludes the large GeoJSON source files.
`AUTO_IMPORT_ACT_DATA` therefore remains disabled in the standard production
deployment.

## Production Runtime

`Dockerfile.runtime` builds the production image in two stages:

1. Install dependencies, generate Prisma and compile the NestJS application.
2. Copy the compiled application and runtime dependencies into a Node.js 20
   Alpine image.

The final image includes Chromium for server-side PDF generation, but it does
not include PostgreSQL or the large ACT GeoJSON source files.

At container startup, `scripts/runtime-entrypoint.sh`:

1. runs `prisma migrate deploy` when `AUTO_MIGRATE=true`
2. runs optional seed operations only when explicitly enabled
3. runs optional ACT imports only when explicitly enabled and data is
   available
4. starts `node dist/src/main.js`

## Production Deployment

`.github/workflows/deploy-azure-acr-prod.yml` deploys every push to `main`. It
also supports a manual `workflow_dispatch`.

The workflow:

1. checks out the repository
2. builds `Dockerfile.runtime` with Docker Buildx
3. pushes `sha-<commit>` and `prod-latest` tags to
   `lotcheck.azurecr.io/lotlogic-be`
4. signs in to Azure
5. deploys the immutable SHA-tagged image to the `lotcheck-be` Container App
   in the `Production` resource group
6. enables automatic migrations and disables automatic seed and ACT imports

Required GitHub Actions secrets:

- `ACR_USERNAME`
- `ACR_PASSWORD`
- `AZURE_CREDENTIALS`
- `PROD_DATABASE_URL`, optional when the Container App already holds the
  correct database setting

The workflow changes the image and the small set of runtime flags it owns. All
other production integration settings and secrets remain managed by the Azure
Container App.

## Security

- Keep all secrets in local `.env`, GitHub Actions secrets or Azure
  secret-backed environment variables.
- Treat versioned product and monday.com JSON files as identifiers and schema
  mappings only.
- Verify every Stripe event using the raw request body and signing secret.
- Fulfill paid products only from verified paid webhook events.
- Require `MONDAY_WEBHOOK_SECRET` outside local development.
- Keep Stripe live and sandbox credentials paired with their matching webhook
  secrets and Price IDs.
- Do not expose backend credentials through frontend build variables.
- Do not use CORS as authentication.
- Keep customer payload logging disabled in production.
- Preserve `productCode`, `sourceApp`, report ID and Stripe payment ID
  metadata when adding a paid product.
- Add each new paid product to the typed product list, product catalog,
  monday.com mapping and checkout regression tests in one release.

## Release Checks

Before pushing shared backend changes to `main`:

```bash
npm run test:stripe-checkout
npm run build
```

After deployment:

1. verify `GET /api/health`
2. verify an existing LotCheck flow
3. create a checkout session from each affected trusted frontend
4. confirm the expected live or sandbox Price ID in Stripe
5. confirm the signed Stripe webhook succeeds
6. confirm one correctly mapped monday.com item is created or updated
7. confirm repeated payment events do not create duplicate paid items

This is a private, unlicensed repository. Treat every deployment as a shared
LotCheck and BlockPlanner release.
