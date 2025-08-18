import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const filePath = path.join(__dirname, '../public/data/mitchell.json')
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const lots = JSON.parse(fileContent)
  for(const lot of lots.features)
  {
    if(lot.geo_type === "lot") {
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
        geojson: { },
        geometry: toPolygon(lot.geometry.coordinates[0].map((c) => c.join(' ')).toString())
      };
      let properties: { [key: string]: number }[] = [];
      const coordinates = lot.geometry.coordinates[0];
      for(let i = 0; i < coordinates.length - 1; i++)
      {
        const distance = calculateDistance(coordinates[i], coordinates[i+1]);
        properties.push({ [`s${i + 1}`]: distance });
      }

      let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;

      lot.geometry.coordinates[0].forEach(([lon, lat]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      });
      const midLat = (minLat + maxLat) / 2;
      const width = calculateDistance([ minLon, midLat ], [ maxLon, midLat ]);
      const depth = calculateDistance([ minLon, minLat ], [ minLon, maxLat ]);

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
                "id" = EXCLUDED."id",
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

        await prisma.$executeRawUnsafe(sql,
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
          data.geometry
        );
      } catch (error) {
        console.error('Error: ' + error);
      }
    }
  }
  // await prisma.lot.createMany({ data: lotData })
  console.log('Lots added successfully.')
}

function toPolygon(coordString) {
  // split into coordinates
  const coords = coordString.trim().split(',').map(p => p.trim());

  // ensure first point is repeated at end to close polygon
  if (coords[0] !== coords[coords.length - 1]) {
    coords.push(coords[0]);
  }

  return `POLYGON((${coords.join(', ')}))`;
}

const calculateArea = (coordinates) => {
  const R = 6378137;
  const toRadians = deg => (deg * Math.PI) / 180;

  if (coordinates.length < 3) return 0; // not a polygon

  let total = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];

    const lon1Rad = toRadians(lon1);
    const lat1Rad = toRadians(lat1);
    const lon2Rad = toRadians(lon2);
    const lat2Rad = toRadians(lat2);

    total += (lon2Rad - lon1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
  }

  const area = Math.abs(total * R * R / 2);
  return Math.round(area); // in square meters
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
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dlon / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));
  const radius = 6378; // Earth radius in km

  return Math.round(c * radius * 10000) / 10; // to meters
};

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
