#!/bin/sh

set -e

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete."

echo "➡️ Running Prisma Seed..."
# npx tsx prisma/seeds/seed.ts
# npx tsx prisma/seeds/lot.ts
echo "✅ Seeding complete."

# npx tsx prisma/seeds/geoData.ts
# npx tsx prisma/seeds/lot.ts

# If you want to reset the database, you can run the following commands:
# npx prisma migrate reset --force
# npx tsx prisma/seeds/seed.ts
# npx tsx prisma/seeds/lot.ts

echo "🚀 Starting NestJS app..."
exec node dist/src/main.js