#!/bin/sh

set -e

cd "$(dirname "$0")/.."

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete."

if [ "${AUTO_SEED}" = "true" ]; then
  SHOULD_SEED="true"
  if [ "${AUTO_SEED_SKIP_IF_DATA}" = "true" ]; then
    HAS_DATA="$(node - <<'NODE'
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
)"
    if [ "$HAS_DATA" = "true" ]; then
      SHOULD_SEED="false"
      echo "ℹ️  Seed data detected; skipping AUTO_SEED."
    fi
  fi

  if [ "$SHOULD_SEED" = "true" ]; then
    echo "➡️ Running seed scripts..."
    npx tsx prisma/seeds/seed.ts
    npx tsx prisma/seeds/geoData.ts
    npx tsx prisma/seeds/lot.ts
    echo "✅ Seeding complete."
  fi
fi

# Optional: Import ACT GeoJSON datasets into PostGIS (runs in background so App Runner can pass health checks).
# Enable by setting AUTO_IMPORT_ACT_DATA=true in the runtime environment.
if [ "${AUTO_IMPORT_ACT_DATA}" = "true" ]; then
  if [ "${ACT_DATA_IMPORT_TRUNCATE}" = "true" ]; then
    IMPORT_FLAGS="--truncate"
  else
    IMPORT_FLAGS="--skip-if-exists"
  fi

  if [ -n "${ACT_LAND_USE_ZONE_GEOJSON_PATH}" ] || [ -n "${ACT_BLOCK_GEOJSON_PATH}" ]; then
    echo "ℹ️  Using ACT_*_GEOJSON_PATH env var(s) for import."
  else
    ZONE_FILE="$(ls -1 data/ACTGOV_TP_LAND_USE_ZONE_*.geojson 2>/dev/null | head -n 1 || true)"
    BLOCK_FILE="$(ls -1 data/ACTGOV_BLOCKS_*.geojson 2>/dev/null | head -n 1 || true)"

    if [ -z "$ZONE_FILE" ] || [ -z "$BLOCK_FILE" ]; then
      echo "⚠️  AUTO_IMPORT_ACT_DATA=true but missing ACT GeoJSON files under ./data; skipping import."
      ls -la data || true
      ZONE_FILE=""
      BLOCK_FILE=""
    fi
  fi

  if [ -n "$ZONE_FILE" ] || [ -n "$BLOCK_FILE" ] || [ -n "${ACT_LAND_USE_ZONE_GEOJSON_PATH}" ] || [ -n "${ACT_BLOCK_GEOJSON_PATH}" ]; then
    echo "🌱 Starting ACT dataset import in background ($IMPORT_FLAGS)..."
    (
      set -e
      sleep 5
      npx tsx prisma/seeds/actLandUseZone.ts $IMPORT_FLAGS
      npx tsx prisma/seeds/actBlock.ts $IMPORT_FLAGS
      echo "✅ ACT dataset import complete."
    ) &
  fi
fi

echo "🚀 Starting NestJS app..."
exec node dist/src/main.js
