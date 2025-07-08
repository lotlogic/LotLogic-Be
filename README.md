# LotLogic Backend

A NestJS-based backend service for managing land lots, estates, and zoning information with geospatial capabilities.

## 🏗️ Project Overview

LotLogic Backend is a comprehensive land management system that handles:
- **Lot Management**: Land parcels with geospatial data and zoning information
- **Estate Management**: Property development projects and their associated lots
- **Zoning Analysis**: Land use regulations and overlay information
- **Geospatial Operations**: PostGIS-powered spatial queries and analysis
- **Enquiry System**: User inquiries and property assessments
- **Planning Integration**: Development plan management
- **Facade Management**: Building facade and design information

## 🚀 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: PostgreSQL with PostGIS extension for geospatial data
- **ORM**: Prisma with custom PostgreSQL extensions
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Testing**: Jest for unit and e2e tests

## 📁 Project Structure

```
src/
├── modules/
│   ├── lot/           # Lot management and geospatial operations
│   ├── estate/        # Estate and property development management
│   ├── zoning/        # Zoning regulations and land use analysis
│   ├── enquiry/       # User inquiry handling
│   ├── facade/        # Building facade management
│   ├── plan/          # Development plan management
│   └── geo/           # Geographic data services
├── prisma/
│   ├── schema.prisma  # Database schema with PostGIS support
│   ├── seed.ts        # Database seeding
│   └── data/          # GeoJSON and CSV data files
├── config/            # Application configuration
└── shared/            # Shared utilities, decorators, and types
```

## 🗄️ Database Schema

### Core Models

- **Lot**: Land parcels with geospatial data, zoning info, and estate relationships
- **Estate**: Property development projects containing multiple lots

### Key Features

- PostGIS geometry columns for spatial operations
- GeoJSON backup storage
- Spatial indexing for performance
- UUID-based primary keys
- Comprehensive audit trails (createdAt, updatedAt)

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- PostgreSQL with PostGIS extension
- pnpm package manager

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LotLogic-Be
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/lotlogic?schema=public"
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   pnpm prisma generate
   
   # Run database migrations
   pnpm prisma migrate dev
   
   # Seed the database (optional)
   pnpm prisma db seed
   ```

## 🚀 Running the Application

### Development
```bash
# Start in development mode with hot reload
pnpm run start:dev

# Start in debug mode
pnpm run start:debug
```

### Production
```bash
# Build the application
pnpm run build

# Start in production mode
pnpm run start:prod
```

## 🧪 Testing

```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Generate test coverage
pnpm run test:cov
```

## 📊 Data Management

The project includes large geospatial datasets:
- **ACTGOV_BLOCKS.geojson** (250MB): ACT Government block boundaries
- **ACTGOV_BLOCKS.csv** (51MB): Block data in CSV format

### Importing Data
```bash
# Run the seed script to import geospatial data
pnpm prisma db seed
```

## 🔧 Development Tools

### Code Quality
```bash
# Format code
pnpm run format

# Lint code
pnpm run lint
```

### Database Management
```bash
# Open Prisma Studio
pnpm prisma studio

# Reset database
pnpm prisma migrate reset

# Deploy migrations to production
pnpm prisma migrate deploy
```

## 🌐 API Endpoints

The application provides RESTful APIs for:

- **Lots**: CRUD operations for land parcels
- **Estates**: Property development management
- **Zoning**: Land use regulation queries
- **Enquiries**: User inquiry handling
- **Plans**: Development plan management
- **Facades**: Building facade data
- **Geo**: Geographic data services

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Application port | 3000 |

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

