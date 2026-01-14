import { PrismaClient } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';
import * as path from 'path';

type Feature = {
  type: 'Feature';
  geometry: unknown;
  properties: Record<string, unknown> | null;
};

const prisma = new PrismaClient();

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function upsertBatch(features: Feature[]): Promise<void> {
  const batchJson = JSON.stringify(features);

  await prisma.$executeRaw`
    INSERT INTO "actBlock" (
      "objectId",
      "blockKey",
      "blockNumber",
      "sectionNumber",
      "derivedAreaSqm",
      "properties",
      "geometry",
      "createdAt",
      "updatedAt"
    )
    SELECT
      (f->'properties'->>'OBJECTID')::int AS "objectId",
      (f->'properties'->>'BLOCK_KEY')::bigint AS "blockKey",
      (f->'properties'->>'BLOCK_NUMBER')::int AS "blockNumber",
      (f->'properties'->>'SECTION_NUMBER')::int AS "sectionNumber",
      NULLIF(f->'properties'->>'BLOCK_DERIVED_AREA', '')::bigint AS "derivedAreaSqm",
      (f->'properties')::jsonb AS "properties",
      ST_SetSRID(ST_GeomFromGeoJSON((f->'geometry')::text), 4326) AS "geometry",
      now(),
      now()
    FROM jsonb_array_elements(${batchJson}::jsonb) AS f
    ON CONFLICT ("objectId")
    DO UPDATE SET
      "blockKey" = EXCLUDED."blockKey",
      "blockNumber" = EXCLUDED."blockNumber",
      "sectionNumber" = EXCLUDED."sectionNumber",
      "derivedAreaSqm" = EXCLUDED."derivedAreaSqm",
      "properties" = EXCLUDED."properties",
      "geometry" = EXCLUDED."geometry",
      "updatedAt" = now()
  `;
}

async function main(): Promise<void> {
  const shouldTruncate = process.argv.includes('--truncate');
  const limitArg = getArgValue('limit');
  const limit = limitArg ? Number(limitArg) : undefined;

  const geoJsonPath =
    getArgValue('file') ??
    path.join(__dirname, '../../data/ACTGOV_BLOCKS_-3707349334185229602.geojson');

  const batchSize = Number(process.env.ACT_BLOCK_SEED_BATCH_SIZE ?? 500);
  const logEvery = Number(process.env.ACT_BLOCK_SEED_LOG_EVERY ?? 5000);

  console.log('🧱 Importing ACT blocks...');
  console.log(`📄 Source: ${geoJsonPath}`);
  console.log(`📦 Batch size: ${batchSize}`);
  if (limit) console.log(`🧪 Limit: ${limit}`);

  if (!existsSync(geoJsonPath)) {
    throw new Error(`GeoJSON file not found: ${geoJsonPath}`);
  }

  if (shouldTruncate) {
    console.log('🧹 Truncating actBlock...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "actBlock" RESTART IDENTITY');
  }

  // stream-json is CommonJS; require keeps this seed runnable under tsx without tsconfig module tweaks.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parser } = require('stream-json');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { pick } = require('stream-json/filters/Pick');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { streamArray } = require('stream-json/streamers/StreamArray');

  const stream = createReadStream(geoJsonPath)
    .pipe(parser())
    .pipe(pick({ filter: 'features' }))
    .pipe(streamArray());

  let processed = 0;
  let batch: Feature[] = [];
  let pendingBatch: Promise<void> = Promise.resolve();
  let done = false;

  const flush = async (features: Feature[]) => {
    if (features.length === 0) return;
    await upsertBatch(features);
    processed += features.length;
    if (processed % logEvery === 0) {
      console.log(`✅ Imported ${processed}`);
    }
  };

  await new Promise<void>((resolve, reject) => {
    const finalize = () => {
      if (done) return;
      done = true;
      pendingBatch
        .then(async () => {
          await flush(batch);
          console.log(`🎉 ACT blocks import complete. Total: ${processed}`);
          resolve();
        })
        .catch(reject);
    };

    stream.on('data', ({ value }: { value: Feature }) => {
      batch.push(value);

      const reachedLimit =
        typeof limit === 'number' && Number.isFinite(limit) && processed + batch.length >= limit;

      if (batch.length >= batchSize || reachedLimit) {
        const currentBatch = batch;
        batch = [];
        stream.pause();

        pendingBatch = pendingBatch
          .then(() => flush(currentBatch))
          .then(() => {
            if (reachedLimit) {
              stream.destroy();
              finalize();
              return;
            }
            stream.resume();
          })
          .catch((err: unknown) => {
            stream.destroy(err as Error);
          });
      }
    });

    stream.on('end', finalize);
    stream.on('close', finalize);
    stream.on('error', reject);
  });
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
