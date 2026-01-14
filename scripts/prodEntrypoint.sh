#!/bin/sh

set -e

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete."

# NOTE: DO NOT UNCOMMENT THESE SEEDS, this will reset the database and seed the data again
# If you want to reset the database, you can run the following commands:
npx prisma migrate reset --force
echo "➡️ Running Prisma Seed..."
npx tsx prisma/seeds/seed.ts --truncate
npx tsx prisma/seeds/lot.ts --truncate
npx tsx prisma/seeds/geoData.ts --truncate
npx tsx prisma/seeds/actLandUseZone.ts --truncate
npx tsx prisma/seeds/actBlock.ts --truncate
echo "✅ Seeding complete."

echo "🚀 Starting NestJS app..."
exec node dist/src/main.js