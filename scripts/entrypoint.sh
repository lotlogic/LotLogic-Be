#!/bin/sh

set -e

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete."

# NOTE: DO NOT UNCOMMENT THESE SEEDS, this will reset the database and seed the data again
# If you want to reset the database, you can run the following commands:
# npx prisma migrate reset --force
# echo "➡️ Running Prisma Seed..."
# npx tsx prisma/seeds/seed.ts
# npx tsx prisma/seeds/lot.ts
# npx tsx prisma/seeds/geoData.ts
# echo "✅ Seeding complete."

echo "🚀 Starting NestJS app..."
exec node dist/src/main.js