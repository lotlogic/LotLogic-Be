#!/bin/sh

set -e

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete."

# Optional: Import ACT GeoJSON datasets into PostGIS (runs in background so App Runner can pass health checks).
# Enable by setting AUTO_IMPORT_ACT_DATA=true in the runtime environment.
if [ "${AUTO_IMPORT_ACT_DATA}" = "true" ]; then
  echo "🌱 Starting ACT dataset import in background..."
  (
    set -e
    sleep 5
    npx tsx prisma/seeds/actLandUseZone.ts --skip-if-exists
    npx tsx prisma/seeds/actBlock.ts --skip-if-exists
    echo "✅ ACT dataset import complete."
  ) &
fi

echo "🚀 Starting NestJS app..."
exec node dist/src/main.js
