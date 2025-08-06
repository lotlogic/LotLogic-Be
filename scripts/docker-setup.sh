#!/bin/bash

# LotLogic Docker Setup Script

echo "🚀 Setting up LotLogic Docker environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to wait for database to be ready
wait_for_db() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    until docker exec lotlogic-postgres-dev pg_isready -U lotlogic_user -d lotlogic_dev; do
        sleep 2
    done
    echo "✅ PostgreSQL is ready!"
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    docker exec lotlogic-backend-dev npx prisma migrate deploy
    echo "✅ Migrations completed!"
}

# Function to seed the database
seed_database() {
    echo "🌱 Seeding database..."
    docker exec lotlogic-backend-dev npx prisma db seed
    echo "✅ Database seeded!"
}

# Main setup process
echo "📦 Building and starting containers..."
docker-compose -f docker-compose.dev.yml up -d --build

# Wait for database to be ready
wait_for_db

# Run migrations
run_migrations

# Seed database
seed_database

echo ""
echo "🎉 LotLogic Docker environment is ready!"
echo ""
echo "📊 Services:"
echo "   Backend API: http://localhost:3000"
echo "   pgAdmin: http://localhost:5050"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "🔑 pgAdmin credentials:"
echo "   Email: admin@lotlogic.com"
echo "   Password: admin123"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.dev.yml down"
echo "   Restart backend: docker-compose -f docker-compose.dev.yml restart backend" 