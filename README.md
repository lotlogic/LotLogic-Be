# LotCheck Backend

A NestJS-based backend service for managing land lots, estates, and zoning information with geospatial capabilities and house design compatibility analysis.

## 🏗️ Project Overview

LotCheck Backend is a comprehensive land management system that handles:
- **Lot Management**: Land parcels with geospatial data and zoning information
- **Estate Management**: Property development projects and their associated lots
- **Zoning Analysis**: Land use regulations and overlay information
- **House Design Compatibility**: Automated analysis of house designs on lots
- **Geospatial Operations**: PostGIS-powered spatial queries and analysis
- **Enquiry System**: User inquiries and property assessments
- **Planning Integration**: Development plan management
- **Facade Management**: Building facade and design information

## 🚀 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: PostgreSQL with PostGIS extension for geospatial data
- **ORM**: Prisma with custom PostgreSQL extensions
- **Language**: TypeScript
- **Package Manager**: npm
- **Testing**: Jest for unit and e2e tests
- **Containerization**: Docker & Docker Compose
- **Database Management**: pgAdmin

## 📁 Project Structure

```
src/
├── modules/
│   ├── lot/              # Lot management and geospatial operations
│   ├── estate/           # Estate and property development management
│   ├── zoning/           # Zoning regulations and land use analysis
│   ├── enquiry/          # User inquiry handling
│   ├── facade/           # Building facade management
│   ├── plan/             # Development plan management
│   ├── design-on-lot/    # House design compatibility analysis
│   ├── builder/          # Builder management
│   └── geo/              # Geographic data services
data/                     # GeoJSON and CSV data files (GeoJSON is large + gitignored; import into PostGIS)
├── prisma/
│   ├── schema.prisma     # Database schema with PostGIS support
│   ├── seeds/
│   │   └── seed.ts       # Database seeding
├── config/               # Application configuration
└── shared/               # Shared utilities, decorators, and types
```

## 🗄️ Database Schema

### Core Models

- **Lot**: Land parcels with geospatial data, zoning info, and estate relationships
- **Estate**: Property development projects containing multiple lots
- **HouseDesign**: House designs with dimensions and lot requirements
- **ZoningRule**: Land use regulations and building restrictions
- **DesignOnLot**: Compatibility analysis results
- **Builder**: Construction company information
- **Enquiry**: User inquiries and property assessments

### Key Features

- PostGIS geometry columns for spatial operations
- GeoJSON backup storage with lot dimensions
- Spatial indexing for performance
- UUID-based primary keys
- Comprehensive audit trails (createdAt, updatedAt)

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- PostgreSQL with PostGIS extension
- npm package manager
- Docker & Docker Compose (for containerized development)

## 📦 Installation

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LotCheck-Be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:lotcheck123@localhost:5432/lotcheck?schema=public"
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database (optional)
   npx tsx prisma/seeds/seed.ts
   npx tsx prisma/seeds/lot.ts
   ```

### Option 2: Docker Development (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LotCheck-Be
   ```

2. **Start with Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up --build -d
   
   # Run database migrations
   docker exec lotcheck-backend npx prisma migrate deploy
   
   # Seed the database
   docker exec lotcheck-backend npx tsx prisma/seeds/seed.ts
   docker exec lotcheck-backend npx tsx prisma/seeds/lot.ts
   ```

## 🚀 Running the Application

### Local Development
```bash
# Start in development mode with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Production
```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```



## 📊 Data Management

The project includes comprehensive data seeding:
- **Sample Lots**: Land parcels with geospatial data and zoning information
- **Zoning Rules**: RZ1-RZ5 zoning regulations with building restrictions
- **House Designs**: Sample house designs with dimensions and requirements
- **Compatibility Analysis**: Automated matching of house designs to lots

### Importing Data
```bash
# Run the seed script to import sample data
npx tsx prisma/seeds/seed.ts
npx tsx prisma/seeds/lot.ts
```

## 🗺️ ACT Land Use Zones (Address → Zone Lookup)

This repo supports importing ACT Gov GeoJSON datasets (EPSG:4326) into PostGIS and querying them via the API:
- `data/ACTGOV_BLOCKS_-3707349334185229602.geojson` (blocks; includes `BLOCK_DERIVED_AREA`)
- `data/ACTGOV_TP_LAND_USE_ZONE_-3480885847246569636.geojson` (land use zones; includes `LAND_USE_ZONE_CODE_ID`)

### 1) Configure Google Geocoding
- Add `GOOGLE_MAPS_API_KEY` to your `.env` (see `.env-example`).

### 2) Apply DB migrations + import GeoJSON (Docker)
```bash
docker exec lotcheck-backend npx prisma migrate deploy
docker exec lotcheck-backend npx tsx prisma/seeds/actLandUseZone.ts --skip-if-exists
docker exec lotcheck-backend npx tsx prisma/seeds/actBlock.ts --skip-if-exists
```

- Use `--truncate` to force a full re-import (drops existing rows first).
- In AWS App Runner, you can set `AUTO_IMPORT_ACT_DATA=true` to run these imports in the background on boot.

### 3) Call the endpoint
- By address: `GET http://localhost:3000/api/geo/act-zone?address=1%20Bunda%20St%20Canberra%20ACT`
- By coordinates (no Google call): `GET http://localhost:3000/api/geo/act-zone?lat=-35.2809&lng=149.1310`
- Response includes both `block` and `zone` (when available). `source` indicates which matched dataset is preferred (blocks first, then land-use zones).
- If `data/2. LotCheck - Reference Data - Rules v3.csv` exists, matching rules for the resolved zone are included under `lotCheckRules` (override path via `LOT_CHECK_RULES_CSV_PATH`).

## 🔧 Development Tools

### Code Quality
```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Database Management
```bash
# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## 🌐 API Endpoints

The application provides RESTful APIs for:

- **Lots**: CRUD operations for land parcels
- **Estates**: Property development management
- **Zoning**: Land use regulation queries
- **House Designs**: House design management
- **Design-on-Lot**: Compatibility analysis
- **Enquiries**: User inquiry handling
- **Plans**: Development plan management
- **Facades**: Building facade data
- **Builders**: Construction company management
- **Geo**: Geographic data services

### Key Endpoints

#### Design-on-Lot Compatibility
```http
GET /design-on-lot/calculate?lotId={lotId}
```

**Response Example:**
```json
{
  "lotId": "23d5cee7-f1fd-454c-a1c7-c932d6c41ec5",
  "zoning": "RZ1",
  "matches": [
    {
      "houseDesignId": "design-1",
      "floorplanUrl": "/floorplans/floorplan.png",
      "spacing": {"front": 4, "rear": 3, "side": 3},
      "maxCoverageArea": 250,
      "houseArea": 150,
      "lotDimensions": {"width": 20, "depth": 35}
    }
  ]
}
```

#### Get In Touch (Feasibility Enquiry)
```http
POST /api/enquiry/get-in-touch
```

Request body (JSON):

```json
{
  "address": "13 Meehan Gardens, Griffith ACT",
  "email": "client@example.com",
  "phone": "+61 400 000 000",
  "message": "Please call me this week",
  "company": "",
  "recaptchaToken": "optional-if-configured"
}
```

Behavior:

- `phone` is required.
- Subject is auto-generated as: `Feasibility assessment enquiry — [address]`.
- Email is sent from backend to `GET_IN_TOUCH_RECIPIENT_EMAIL` (defaults to `mitch@blockplanner.com.au`).
- Honeypot support: if `company` is populated, submission is treated as spam and ignored.
- Optional reCAPTCHA verification is enabled when `RECAPTCHA_SECRET_KEY` is set.

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3000 | NestJS application |
| PostgreSQL | 5432 | Database with PostGIS |
| pgAdmin | 5050 | Database management UI |

### Accessing Services
- **Backend API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@lotcheck.com / admin123)
- **PostgreSQL**: localhost:5432

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Application port | 3000 |
| `NODE_ENV` | Environment mode | development |

## 💳 Stripe Webhook → monday.com

This service exposes a Stripe webhook endpoint and upserts a paid-report item into the BlockPlanner monday board.

- `POST /api/stripe/webhook`
- Requires Stripe signature verification via env var `STRIPE_WEBHOOK_SECRET`.
- `POST /api/stripe/create-checkout-session` now generates the `reportId` in the backend before creating the Stripe Checkout Session.
- On `checkout.session.completed` (and `payment_intent.succeeded`), the webhook extracts these metadata keys and forwards them to monday:
  `reportId`, `clientName`, `clientEmail`, `clientPhone`, `address`, `suburb`, `blockSizeM2`, `zone`, `stripePaymentId`.

### Setup

Set env vars (see `.env-example`):

- `MONDAY_API_TOKEN`
- Optional: `MONDAY_API_BASE_URL` (defaults to `https://api.monday.com/v2`)
- Optional: `MONDAY_API_VERSION`
- Optional: `MONDAY_PAID_REPORTS_BOARD_ID`
- Optional: `MONDAY_PAID_REPORTS_GROUP_ID`
- Optional: `MONDAY_TREE_LOCATION_COLUMN_ID`
- Optional: `MONDAY_REGISTERED_TREES_COLUMN_ID`
- Optional: `MONDAY_WEBHOOK_SECRET`

### Example request

```bash
curl -X POST "http://localhost:3000/api/stripe/create-checkout-session" \
  -H "Content-Type: application/json" \
  -d '{"site":"http://localhost:5173","intention":"Open to options","clientName":"Jane Citizen","clientEmail":"jane@example.com","clientPhone":"+61 400 000 000","address":"1 George St","suburb":"Sydney","blockSizeM2":"450","zone":"R2"}'
```

## 📄 monday Dashboard Trigger → PDF

This service exposes endpoints that accept monday webhook payloads, load the monday item data from the BlockPlanner paid-reports board, generate the PDF in the background, upload it to Azure Blob Storage, then update the originating monday item with the final PDF link or delivery status:

- `POST /api/monday/dashboard-trigger`
- `POST /api/monday/dashboard-delivery`
- If monday sends a webhook challenge, the backend echoes it back automatically.
- If `MONDAY_WEBHOOK_SECRET` is set, send it as `?secret=...`, `x-webhook-secret`, or JSON field `secret`.
- Expects a monday item id (for example `itemId` or `event.pulseId`) and fetches the board data directly.
- Responds immediately while the PDF/email work continues in the background.

### Background flow

1. Render HTML from `src/templates/dashboard-report.pug`.
2. Convert HTML → PDF via headless Chromium (`puppeteer-core`).
3. Upload PDF to Azure Blob Storage.
4. Update the monday item with `Final PDF link`, `Delivery status`, and `Delivery date` as required.

### Setup

Set env vars (see `.env-example`):

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER`
- Optional: `AZURE_STORAGE_FOLDER` (defaults to `dashboard-reports`)
- Optional: `CHROME_EXECUTABLE_PATH` (only needed if Chrome/Chromium isn't on a standard path)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and unlicensed. All rights reserved.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: August 2025
**Status**: ✅ Fully functional with npm package manager and Docker support


