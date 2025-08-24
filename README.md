# LotLogic Backend

A NestJS-based backend service for managing land lots, estates, and zoning information with geospatial capabilities and house design compatibility analysis.

## 🏗️ Project Overview

LotLogic Backend is a comprehensive land management system that handles:
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
├── prisma/
│   ├── schema.prisma     # Database schema with PostGIS support
│   ├── seeds/
│   │   └── seed.ts       # Database seeding
│   └── data/             # GeoJSON and CSV data files
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
   cd LotLogic-Be
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:lotlogic123@localhost:5432/lotlogic?schema=public"
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
   cd LotLogic-Be
   ```

2. **Start with Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up --build -d
   
   # Run database migrations
   docker exec lotlogic-backend npx prisma migrate deploy
   
   # Seed the database
   docker exec lotlogic-backend npx tsx prisma/seeds/seed.ts
   docker exec lotlogic-backend npx tsx prisma/seeds/lot.ts
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

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3000 | NestJS application |
| PostgreSQL | 5432 | Database with PostGIS |
| pgAdmin | 5050 | Database management UI |

### Accessing Services
- **Backend API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@lotlogic.com / admin123)
- **PostgreSQL**: localhost:5432

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Application port | 3000 |
| `NODE_ENV` | Environment mode | development |

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

