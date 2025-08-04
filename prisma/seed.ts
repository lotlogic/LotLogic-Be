import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Create sample zoning rules
  const zoningRule1 = await prisma.zoningRule.upsert({
    where: { code: 'RZ1' },
    update: {},
    create: {
      code: 'RZ1',
      name: 'Residential Zone 1',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 4,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      appliesToZones: ['RZ1']
    }
  });

  const zoningRule2 = await prisma.zoningRule.upsert({
    where: { code: 'RZ2' },
    update: {},
    create: {
      code: 'RZ2',
      name: 'Residential Zone 2',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 6,
      minRearSetback_m: 4,
      minSideSetback_m: 4,
      minFSR: 0.4,
      appliesToZones: ['RZ2']
    }
  });

  // Create sample lots
  const lot1 = await prisma.lot.upsert({
    where: { blockKey: 'BLOCK123' },
    update: {},
    create: {
      blockKey: 'BLOCK123',
      blockNumber: 101,
      sectionNumber: 202,
      areaSqm: 500.0,
      zoning: 'RZ1',
      address: '101 Block Street, Canberra',
      district: 'Gungahlin',
      division: 'Division A',
      lifecycleStage: 'Available',
      overlays: ['BPA'],
      geojson: {
        properties: {
          width: 20,
          depth: 35
        }
      }
    }
  });

  const lot2 = await prisma.lot.upsert({
    where: { blockKey: 'BLOCK456' },
    update: {},
    create: {
      blockKey: 'BLOCK456',
      blockNumber: 102,
      sectionNumber: 203,
      areaSqm: 600.0,
      zoning: 'RZ2',
      address: '102 Block Street, Canberra',
      district: 'Belconnen',
      division: 'Division B',
      lifecycleStage: 'Available',
      overlays: ['BPA'],
      geojson: {
        properties: {
          width: 25,
          depth: 40
        }
      }
    }
  });

  // Create sample house designs
  // const houseDesign1 = await prisma.houseDesign.upsert({
  //   where: { id: '8b9d3fa1-fcfe-41bf-b5d5-bf231aedd432' },
  //   update: {},
  //   create: {
  //     id: '8b9d3fa1-fcfe-41bf-b5d5-bf231aedd432',
  //     name: 'Haven 24',
  //     floorplanUrl: 'http://localhost:3000/floorplans/floorplan.png',
  //     bedrooms: 4,
  //     bathrooms: 2,
  //     garages: 2,
  //     areaSqm: 220.5,
  //     minLotWidth: 12.5,
  //     minLotDepth: 30.0
  //   }
  // });

  // const houseDesign2 = await prisma.houseDesign.upsert({
  //   where: { id: '7801c8f2-1ccc-4126-9a52-37207662fbac' },
  //   update: {},
  //   create: {
  //     id: '7801c8f2-1ccc-4126-9a52-37207662fbac',
  //     name: 'Aspire 28',
  //     floorplanUrl: 'http://localhost:3000/floorplans/floorplan.png',
  //     bedrooms: 5,
  //     bathrooms: 3,
  //     garages: 2,
  //     areaSqm: 270.0,
  //     minLotWidth: 14.0,
  //     minLotDepth: 32.0
  //   }
  // });

  // Link lots to zoning rules
  await prisma.lotZoningRule.upsert({
    where: { lotId_zoningRuleId: { lotId: lot1.id, zoningRuleId: zoningRule1.id } },
    update: {},
    create: {
      lotId: lot1.id,
      zoningRuleId: zoningRule1.id,
      isOverlay: false
    }
  });

  await prisma.lotZoningRule.upsert({
    where: { lotId_zoningRuleId: { lotId: lot2.id, zoningRuleId: zoningRule2.id } },
    update: {},
    create: {
      lotId: lot2.id,
      zoningRuleId: zoningRule2.id,
      isOverlay: false
    }
  });

  console.log('✅ Sample data created successfully!');
  console.log(`Lot 1 ID: ${lot1.id}`);
  console.log(`Lot 2 ID: ${lot2.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
