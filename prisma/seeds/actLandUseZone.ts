import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

type FeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: unknown;
    properties: Record<string, unknown> | null;
  }>;
};

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const shouldTruncate = process.argv.includes('--truncate');
  const shouldSkipIfExists = process.argv.includes('--skip-if-exists');
  const geoJsonPath =
    process.argv.find((arg) => arg.startsWith('--file='))?.split('=')[1] ??
    path.join(process.cwd(), 'data', 'ACTGOV_TP_LAND_USE_ZONE_-3480885847246569636.geojson');

  console.log('🗺️  Importing ACT land use zones...');
  console.log(`📄 Source: ${geoJsonPath}`);

  if (!fs.existsSync(geoJsonPath)) {
    throw new Error(`GeoJSON file not found: ${geoJsonPath}`);
  }

  if (shouldTruncate) {
    console.log('🧹 Truncating actLandUseZone...');
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "actLandUseZone" RESTART IDENTITY',
    );
  } else if (shouldSkipIfExists) {
    const existing = await prisma.actLandUseZone.findFirst({
      select: { id: true },
    });
    if (existing) {
      console.log('⏭️  actLandUseZone already contains rows; skipping import.');
      return;
    }
  }

  const raw = fs.readFileSync(geoJsonPath, 'utf-8');
  const parsed = JSON.parse(raw) as FeatureCollection;

  if (parsed?.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
    throw new Error('Invalid GeoJSON: expected a FeatureCollection');
  }

  const total = parsed.features.length;
  const batchSize = Number(process.env.ACT_LAND_USE_ZONE_SEED_BATCH_SIZE ?? 100);

  let processed = 0;
  let batch: ReturnType<typeof prisma.$executeRaw>[] = [];

  for (const feature of parsed.features) {
    const properties = feature.properties ?? {};
    const objectId = Number(properties['OBJECTID']);
    const zoneCode = String(properties['LAND_USE_ZONE_CODE_ID'] ?? '').trim();

    if (!Number.isFinite(objectId)) {
      throw new Error('Invalid feature: missing numeric properties.OBJECTID');
    }
    if (!zoneCode) {
      throw new Error(
        `Invalid feature OBJECTID=${objectId}: missing LAND_USE_ZONE_CODE_ID`,
      );
    }
    if (!feature.geometry) {
      throw new Error(`Invalid feature OBJECTID=${objectId}: missing geometry`);
    }

    const propertiesJson = JSON.stringify(properties);
    const geometryJson = JSON.stringify(feature.geometry);

    batch.push(
      prisma.$executeRaw`
        INSERT INTO "actLandUseZone" (
          "objectId",
          "zoneCode",
          "properties",
          "geometry",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${objectId},
          ${zoneCode},
          ${propertiesJson}::jsonb,
          ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326),
          now(),
          now()
        )
        ON CONFLICT ("objectId")
        DO UPDATE SET
          "zoneCode" = EXCLUDED."zoneCode",
          "properties" = EXCLUDED."properties",
          "geometry" = EXCLUDED."geometry",
          "updatedAt" = now()
      `,
    );

    processed += 1;
    if (batch.length >= batchSize) {
      await prisma.$transaction(batch);
      batch = [];
      console.log(`✅ Imported ${processed}/${total}`);
    }
  }

  if (batch.length > 0) {
    await prisma.$transaction(batch);
    console.log(`✅ Imported ${processed}/${total}`);
  }

  console.log('🎉 ACT land use zone import complete.');
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
