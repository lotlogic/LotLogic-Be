#!/usr/bin/env bash

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
FORCE_SEED="${FORCE_SEED:-false}"

dc() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

echo "🚀 Setting up LotCheck local Docker environment..."
echo "   compose file: $COMPOSE_FILE"

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

wait_for_db() {
  echo "⏳ Waiting for PostgreSQL to be ready..."
  until dc exec -T postgres pg_isready -U postgres -d lotcheck >/dev/null 2>&1; do
    sleep 2
  done
  echo "✅ PostgreSQL is ready!"
}

run_migrations() {
  echo "🔄 Running database migrations..."
  dc exec -T backend npx prisma migrate deploy
  echo "✅ Migrations completed!"
}

has_seed_data() {
  dc exec -T backend node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const floorPlanCount = await prisma.floorPlan.count();
    process.stdout.write(floorPlanCount > 0 ? 'true' : 'false');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
NODE
}

seed_database() {
  if [ "$FORCE_SEED" = "true" ]; then
    SHOULD_SEED="true"
  else
    SHOULD_SEED="$(has_seed_data)"
    SHOULD_SEED="$([ "$SHOULD_SEED" = "true" ] && echo "false" || echo "true")"
  fi

  if [ "$SHOULD_SEED" = "false" ]; then
    echo "ℹ️  Seed data detected; skipping seeds (set FORCE_SEED=true to override)."
    return
  fi

  echo "🌱 Seeding database..."
  dc exec -T backend npx tsx prisma/seeds/seed.ts
  dc exec -T backend npx tsx prisma/seeds/geoData.ts
  dc exec -T backend npx tsx prisma/seeds/lot.ts
  echo "✅ Database seeded!"
}

echo "📦 Building and starting containers..."
dc up -d --build

wait_for_db
run_migrations
seed_database

echo ""
echo "🎉 LotCheck Docker environment is ready!"
echo ""
echo "📊 Services:"
echo "   Backend API: http://localhost:3000/api"
echo "   pgAdmin: http://localhost:5050"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker compose -f $COMPOSE_FILE logs -f backend"
echo "   Stop services: docker compose -f $COMPOSE_FILE down"
echo "   Reset volumes: docker compose -f $COMPOSE_FILE down -v"

