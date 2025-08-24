import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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

      let minLat = Infinity,
        maxLat = -Infinity,
        minLon = Infinity,
        maxLon = -Infinity;

      lot.geometry.coordinates[0].forEach(([lon, lat]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      });
      const midLat = (minLat + maxLat) / 2;
      const width = calculateDistance([minLon, midLat], [maxLon, midLat]);
      const depth = calculateDistance([minLon, minLat], [minLon, maxLat]);

      data.geojson = { properties, width, depth };
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
  // await prisma.lot.createMany({ data: lotData })
  console.log('Lots added successfully.');
}

function toPolygon(coordString) {
  // split into coordinates
  const coords = coordString
    .trim()
    .split(',')
    .map((p) => p.trim());

  // ensure first point is repeated at end to close polygon
  if (coords[0] !== coords[coords.length - 1]) {
    coords.push(coords[0]);
  }

  return `POLYGON((${coords.join(', ')}))`;
}

// using the spherical “trapezoid” formula:
const calculateArea = (coords: [number, number][]) => {
  const R = 6378137; // WGS84 semi-major, meters
  const toRad = (d: number) => (d * Math.PI) / 180;

  // In case the ring is not closed, close it
  const ring =
    coords[0][0] === coords[coords.length - 1][0] &&
    coords[0][1] === coords[coords.length - 1][1]
      ? coords
      : [...coords, coords[0]];

  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    let dLambda = toRad(lon2) - toRad(lon1);

    // normalize Δλ into [-π, π] to be safe for rings that might cross 180°
    if (dLambda > Math.PI) dLambda -= 2 * Math.PI;
    else if (dLambda < -Math.PI) dLambda += 2 * Math.PI;

    sum += dLambda * (Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  const area = Math.abs(((R * R) / 2) * sum);
  return Math.round(area * 100) / 100; // two decimals
};

const calculateDistance = (start, end) => {
  const toRadians = (deg) => (deg * Math.PI) / 180;

  const lat1 = toRadians(start[1]);
  const lon1 = toRadians(start[0]);
  const lat2 = toRadians(end[1]);
  const lon2 = toRadians(end[0]);

  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;

  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));
  const radius = 6378; // Earth radius in km

  return Math.round(c * radius * 10000) / 10; // to meters
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
