#!/bin/sh

set -e

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete."

echo "➡️ Running Prisma Seed..."
npx tsx prisma/seeds/seed.ts
npx tsx prisma/seeds/lot.ts
echo "✅ Seeding complete."


echo "🚀 Starting NestJS app..."
exec node dist/src/main.js