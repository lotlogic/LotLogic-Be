import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const filePath = path.join(__dirname, '../public/data/data.json')
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const lots = JSON.parse(fileContent)
  let i = 1;
  for(const lot of lots.features)
  {
    if(lot.type === "lot") {
      let properties: { [key: string]: number }[] = [];
      for(let i = 0; i < lot.geometry.coordinates[0].length - 1; i++)
      {
        const distance = calculateDistance(lot.geometry.coordinates[0][i], lot.geometry.coordinates[0][i+1]);
        properties.push({ [`s${i + 1}`]: distance });
      }
      let data = {
        blockKey: lot.blockKey + i,
        blockNumber: lot.blockNumber,
        sectionNumber: lot.sectionNumber,
        areaSqm: calculateArea(lot.geometry.coordinates[0]),
        zoning: lot.zoning,
        address: lot.address,
        district: lot.district,
        division: lot.division,
        lifecycleStage: lot.lifecycleArea,
        estateId: lot.estateId,
        geojson: { properties },
        geometry: toPolygon(lot.geometry.coordinates[0].map((c) => c.join(' ')).toString()),
        // overlays: lot.overlays,
        // createdAt: lot.createdAt,
        // updatedAt: lot.updatedAt,
      };
      // console.log(data);
      try {
        const sql = `
          INSERT INTO lot (
            "id", "blockKey", "blockNumber", "sectionNumber", "areaSqm", "zoning", "address",
            "district", "division", "lifecycleStage", "estateId", "geojson", "geometry", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            ST_GeomFromText($13, 4326), now(), now()
          )
        `;

        await prisma.$executeRawUnsafe(sql,
          i,
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
      
      i++;
    }
  }
  console.log(i);
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

const calculateArea = (data) => {
  const R = 6378;
  const toRadians = deg => deg * Math.PI / 180;

  let area = 0;

  for (let i = 0; i < data.length - 1; i++) {
    const [lon1, lat1] = data[i];
    const [lon2, lat2] = data[i + 1];

    area += toRadians(lon2 - lon1) * (
      2 + Math.sin(toRadians(lat1)) + Math.sin(toRadians(lat2))
    );
  }

  area = Math.abs(area * R * R / 2);
  return Math.round(area * R * 10000) / 10;
}
const calculateDistance = (start, end) => {
  start[1] = (start[1] * Math.PI) / 180;
  end[1] = (end[1] * Math.PI) / 180;
  start[0] = (start[0] * Math.PI) / 180;
  end[0] = (end[0] * Math.PI) / 180;

  // Haversine formula
  const dlon = end[1] - start[1];
  const dlat = end[0] - start[0];
  const a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(start[0]) *
      Math.cos(end[0]) *
      Math.pow(Math.sin(dlon / 2), 2);

  const c = 2 * Math.asin(Math.sqrt(a));

  const radius = 6378;

  return Math.round(c * radius * 10000) / 10;
};

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
