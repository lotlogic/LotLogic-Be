import { calculateArea, calculateDistance, getWidthHeight } from '../../src/helper/turf';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(
    __dirname,
    '../../src/data/hamiltonRiseMitchell.json',
  );
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lots = JSON.parse(fileContent);
  for (const lot of lots.features) {
    if (lot.geo_type === 'lot') {
      let data: {
        blockKey,
        blockNumber,
        sectionNumber,
        areaSqm,
        zoning,
        address,
        district,
        division,
        lifecycleStage,
        estateId,
        geojson,
        geometry,
      } = {
        blockKey: lot.blockKey,
        blockNumber: lot.blockNumber,
        sectionNumber: lot.sectionNumber,
        areaSqm: calculateArea(lot.geometry.coordinates[0]),
        zoning: lot.zoning,
        address: lot.address,
        district: lot.district,
        division: lot.division,
        lifecycleStage: lot.lifecycleArea,
        estateId: lot.estateId,
        geojson: {},
        geometry: toPolygon(
          lot.geometry.coordinates[0].map((c) => c.join(' ')).toString(),
        ),
      };
      let properties: { [key: string]: number }[] = [];
      const coordinates = lot.geometry.coordinates[0];
      for (let i = 0; i < coordinates.length - 1; i++) {
        const distance = calculateDistance(coordinates[i], coordinates[i + 1]);
        properties.push({ [`s${i + 1}`]: distance });
      }
      const { width, height } = getWidthHeight(lot.geometry.coordinates[0]);

      data.geojson = { properties, width, depth: height };
      try {
        const sql = `
              INSERT INTO lot (
                "blockKey", "blockNumber", "sectionNumber", "areaSqm", "zoning", "address",
                "district", "division", "lifecycleStage", "estateId", "geojson", "geometry", "createdAt", "updatedAt"
              ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                ST_GeomFromText($12, 4326), now(), now()
              )
              ON CONFLICT ("blockKey")
              DO UPDATE SET 
                "blockNumber" = $2,
                "sectionNumber" = $3,
                "areaSqm" = $4,
                "zoning" = $5,
                "address" = $6,
                "district" = $7,
                "division" = $8,
                "lifecycleStage" = $9,
                "estateId" = $10,
                "geojson" = $11,
                "geometry" = ST_GeomFromText($12, 4326),
                "updatedAt" = now()
        `;

        await prisma.$executeRawUnsafe(
          sql,
          data.blockKey,
          data.blockNumber,
          data.sectionNumber,
          data.areaSqm,
          data.zoning,
          data.address,
          data.district,
          data.division,
          data.lifecycleStage,
          data.estateId,
          data.geojson,
          data.geometry,
        );
      } catch (error) {
        console.error('Error: ' + error);
      }
    }
  }
  console.log('Lots added successfully.');
}

function toPolygon(coordString) {
  const coords = coordString
    .trim()
    .split(',')
    .map((p) => p.trim());

  if (coords[0] !== coords[coords.length - 1]) {
    coords.push(coords[0]);
  }

  return `POLYGON((${coords.join(', ')}))`;
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
