#!/bin/sh

set -e

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete."

echo "➡️ Running Prisma Seed..."
npx prisma db seed

echo "✅ Seeding complete."

echo "🚀 Starting NestJS app..."
exec node dist/src/main.js