/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

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
      maxFSR: 0.5,
      maxBuildingHeight_m: 8.5,
      appliesToZones: ['RZ1']
    }
  }) as any;

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
      maxFSR: 0.6,
      maxBuildingHeight_m: 9.0,
      appliesToZones: ['RZ2']
    }
  }) as any;

  const zoningRule3 = await prisma.zoningRule.upsert({
    where: { code: 'RZ3' },
    update: {},
    create: {
      code: 'RZ3',
      name: 'Residential Zone 3',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 4.5,
      minRearSetback_m: 3.5,
      minSideSetback_m: 3.5,
      minFSR: 0.45,
      maxFSR: 0.55,
      maxBuildingHeight_m: 8.8,
      appliesToZones: ['RZ3']
    }
  }) as any;

  // Create sample estate
  const estate = await prisma.estate.upsert({
    where: { id: 'estate-1' },
    update: {},
    create: {
      id: 'estate-1',
      name: 'Canberra Heights Estate',
      logoUrl: 'http://localhost:3000/estates/canberra-heights-logo.png',
      themeColor: '#2F5D62',
      email: 'info@canberraheights.com',
      phone: '+61 2 6123 4567',
      address: 'Canberra Heights, ACT 2600'
    }
  }) as any;

  // Create sample lots with estate relationship
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
      estateId: estate.id,
      geojson: {
        properties: {
          width: 20,
          depth: 35
        }
      }
    }
  }) as any;

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
      estateId: estate.id,
      geojson: {
        properties: {
          width: 25,
          depth: 40
        }
      }
    }
  }) as any;

  const lot3 = await prisma.lot.upsert({
    where: { blockKey: 'BLOCK789' },
    update: {},
    create: {
      blockKey: 'BLOCK789',
      blockNumber: 103,
      sectionNumber: 204,
      areaSqm: 450.0,
      zoning: 'RZ3',
      address: '103 Block Street, Canberra',
      district: 'Woden',
      division: 'Division C',
      lifecycleStage: 'Available',
      overlays: ['BPA'],
      estateId: estate.id,
      geojson: {
        properties: {
          width: 18,
          depth: 30
        }
      }
    }
  }) as any;

  // Create sample house designs
  const houseDesign1 = await prisma.houseDesign.upsert({
    where: { id: 'design-1' },
    update: {},
    create: {
      id: 'design-1',
      name: 'Modern 3BR House',
      floorplanUrl: '/floorplans/floorplan.png',
      bedrooms: 3,
      bathrooms: 2,
      garages: 1,
      areaSqm: 150.0,
      minLotWidth: 12.0,
      minLotDepth: 15.0,
      rumpus: false,
      alfresco: true,
      pergola: false
    }
  }) as any;

  const houseDesign2 = await prisma.houseDesign.upsert({
    where: { id: 'design-2' },
    update: {},
    create: {
      id: 'design-2',
      name: 'Compact 2BR House',
      floorplanUrl: '/floorplans/floorplan.png',
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      areaSqm: 100.0,
      minLotWidth: 10.0,
      minLotDepth: 12.0,
      rumpus: false,
      alfresco: false,
      pergola: true
    }
  }) as any;

  const houseDesign3 = await prisma.houseDesign.upsert({
    where: { id: 'design-3' },
    update: {},
    create: {
      id: 'design-3',
      name: 'Luxury 4BR House',
      floorplanUrl: '/floorplans/floorplan.png',
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
      areaSqm: 200.0,
      minLotWidth: 15.0,
      minLotDepth: 20.0,
      rumpus: true,
      alfresco: true,
      pergola: true
    }
  }) as any;

  // Create sample builder
  const builder = await prisma.builder.upsert({
    where: { id: 'builder-1' },
    update: {},
    create: {
      id: 'builder-1',
      name: 'Canberra Builders Pty Ltd',
      email: 'info@canberrabuilders.com.au',
      phone: '+61 2 6123 4567'
    }
  }) as any;

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

  await prisma.lotZoningRule.upsert({
    where: { lotId_zoningRuleId: { lotId: lot3.id, zoningRuleId: zoningRule3.id } },
    update: {},
    create: {
      lotId: lot3.id,
      zoningRuleId: zoningRule3.id,
      isOverlay: false
    }
  });

  // Create sample enquiries
  const enquiry1 = await prisma.enquiry.upsert({
    where: { id: 'enquiry-1' },
    update: {},
    create: {
      id: 'enquiry-1',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+61 412 345 678',
      comments: 'Interested in lot BLOCK123 for a 3-bedroom house',
      lotId: lot1.id,
      houseDesignId: houseDesign1.id
    }
  }) as any;

  const enquiry2 = await prisma.enquiry.upsert({
    where: { id: 'enquiry-2' },
    update: {},
    create: {
      id: 'enquiry-2',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+61 423 456 789',
      comments: 'Looking for a compact house on lot BLOCK456',
      lotId: lot2.id,
      houseDesignId: houseDesign2.id
    }
  }) as any;

  // Link enquiries to builders
  await prisma.enquiryBuilder.upsert({
    where: { enquiryId_builderId: { enquiryId: enquiry1.id, builderId: builder.id } },
    update: {},
    create: {
      enquiryId: enquiry1.id,
      builderId: builder.id
    }
  });

  await prisma.enquiryBuilder.upsert({
    where: { enquiryId_builderId: { enquiryId: enquiry2.id, builderId: builder.id } },
    update: {},
    create: {
      enquiryId: enquiry2.id,
      builderId: builder.id
    }
  });

  // Create sample facades
  await prisma.facade.upsert({
    where: { id: 'facade-1' },
    update: {},
    create: {
      id: 'facade-1',
      label: 'Modern Facade',
      imageUrl: '/facades/modern-facade.jpg',
      houseDesignId: houseDesign1.id
    }
  });

  await prisma.facade.upsert({
    where: { id: 'facade-2' },
    update: {},
    create: {
      id: 'facade-2',
      label: 'Traditional Facade',
      imageUrl: '/facades/traditional-facade.jpg',
      houseDesignId: houseDesign2.id
    }
  });

  console.log('✅ Sample data created successfully!');
  console.log('');
  console.log('📊 Database Summary:');
  console.log(`   • Lots: 3 (${lot1.id}, ${lot2.id}, ${lot3.id})`);
  console.log(`   • Zoning Rules: 3 (RZ1, RZ2, RZ3)`);
  console.log(`   • House Designs: 3 (${houseDesign1.id}, ${houseDesign2.id}, ${houseDesign3.id})`);
  console.log(`   • Estate: 1 (${estate.id})`);
  console.log(`   • Builder: 1 (${builder.id})`);
  console.log(`   • Enquiries: 2 (${enquiry1.id}, ${enquiry2.id})`);
  console.log('');
  console.log('🔗 Sample API Endpoints:');
  console.log(`   • GET /design-on-lot/calculate?lotId=${lot1.id}`);
  console.log(`   • GET /lot/${lot1.id}`);
  console.log(`   • GET /estate/${estate.id}`);
  console.log(`   • GET /house-design/${houseDesign1.id}`);
  console.log('');
  console.log('📋 Database Query Examples:');
  console.log('   • Get lot with relationships:');
  console.log(`     SELECT l.*, e.name as estate_name, zr.code as zoning_code`);
  console.log(`     FROM "Lot" l`);
  console.log(`     LEFT JOIN "Estate" e ON l."estateId" = e.id`);
  console.log(`     LEFT JOIN "ZoningRule" zr ON l.zoning = zr.code`);
  console.log(`     WHERE l.id = '${lot1.id}';`);
  console.log('');
  console.log('   • Get house designs compatible with a lot:');
  console.log(`     SELECT hd.*, l."blockKey", l.zoning`);
  console.log(`     FROM "HouseDesign" hd, "Lot" l`);
  console.log(`     WHERE l.id = '${lot1.id}'`);
  console.log(`     AND hd."minLotWidth" <= (l.geojson->>'properties'->>'width')::float`);
  console.log(`     AND hd."minLotDepth" <= (l.geojson->>'properties'->>'depth')::float;`);
}

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
