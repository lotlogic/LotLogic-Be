
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  // Create sample estate
  await prisma.estate.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Canberra Heights Estate',
      logoUrl: 'http://localhost:3000/estates/canberra-heights-logo.png',
      themeColor: '#2F5D62',
      email: 'info@canberraheights.com',
      phone: '+61 2 6123 4567',
      address: 'Canberra Heights, ACT 2600'
    }
  });

    await prisma.zoningRule.upsert({
    where: { code: 'RZ1' },
    update: {
      name: 'Residential Zone 1',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 4,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.65,
      maxStoreys: 2,
      maxBuildingHeight_m: 8.5,
      appliesToZones: ['RZ1']
    },
    create: {
      code: 'RZ1',
      name: 'Residential Zone 1',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 4,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.65,
      maxStoreys: 2,
      maxBuildingHeight_m: 8.5,
      appliesToZones: ['RZ1']
    }
  });

  await prisma.zoningRule.upsert({
    where: { code: 'RZ2' },
    update: {
      name: 'Residential Zone 2',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 4,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.5,
      maxStoreys: 2,
      maxBuildingHeight_m: 8.5,
      appliesToZones: ['RZ2']
    },
    create: {
      code: 'RZ2',
      name: 'Residential Zone 2',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 4,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.5,
      maxStoreys: 2,
      maxBuildingHeight_m: 8.5,
      appliesToZones: ['RZ2']
    }
  });

  await prisma.zoningRule.upsert({
    where: { code: 'RZ3' },
    update: {
      name: 'Residential Zone 3',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 10,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.65,
      maxStoreys: 2,
      maxBuildingHeight_m: 9.5,
      appliesToZones: ['RZ3']
    },
    create: {
      code: 'RZ3',
      name: 'Residential Zone 3',
      type: 'Residential',
      isOverlay: false,
      minFrontSetback_m: 10,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.65,
      maxStoreys: 2,
      maxBuildingHeight_m: 9.5,
      appliesToZones: ['RZ3']
    }
  });

  await prisma.zoningRule.upsert({
    where: { code: 'RZ4' },
    update: {
      name: 'Residential Zone 4',
      type: 'ZONE',
      isOverlay: false,
      minFrontSetback_m: 6,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.8,
      maxStoreys: 2,
      maxBuildingHeight_m: 12.5,
      appliesToZones: ['RZ4']
    },
    create: {
      code: 'RZ4',
      name: 'Residential Zone 4',
      type: 'ZONE',
      isOverlay: false,
      minFrontSetback_m: 6,
      minRearSetback_m: 3,
      minSideSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.8,
      maxStoreys: 2,
      maxBuildingHeight_m: 12.5,
      appliesToZones: ['RZ4']
    }
  });

  await prisma.zoningRule.upsert({
    where: { code: 'RZ5' },
    update: {
      name: 'Residential Zone 5',
      type: 'ZONE',
      isOverlay: false,
      minFrontSetback_m: 6,
      minSideSetback_m: 3,
      minRearSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.8,
      maxStoreys: 2,
      maxBuildingHeight_m: 21.5,
      appliesToZones: ['RZ5']
    },
    create: {
      code: 'RZ5',
      name: 'Residential Zone 5',
      type: 'ZONE',
      isOverlay: false,
      minFrontSetback_m: 6,
      minSideSetback_m: 3,
      minRearSetback_m: 3,
      minFSR: 0.5,
      maxFSR: 0.8,
      maxStoreys: 2,
      maxBuildingHeight_m: 21.5,
      appliesToZones: ['RZ5']
    }
  });

  // Create sample house designs
  const houseDesign1 = await prisma.floorPlan.create({
    data: {
      name: 'Modern 3BR House',
      floorplanUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/floorplan1.jpeg',
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
  });

  const houseDesign2 = await prisma.floorPlan.create({
    data: {
      name: 'Compact 2BR House',
      floorplanUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/floorplan2.jpeg',
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
  });

  // Create sample builder
  await prisma.builder.create({
    data: {
      name: 'Canberra Builders Pty Ltd',
      email: 'info@canberrabuilders.com.au',
      phone: '+61 2 6123 4567'
    }
  });

  // Create sample facades
  await prisma.facade.create({
    data: {
      label: 'Modern Facade',
      imageUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/brick.jpg',
      floorPlanId: houseDesign1.id
    }
  });

  await prisma.facade.create({
    data: {
      label: 'Traditional Facade',
      imageUrl: '/facades/traditional-facade.jpg',
      floorPlanId: houseDesign2.id
    }
  });

  console.log('✅ Sample data created successfully!');
  
  console.log('✅ Created possible houseDesigns');
  
  // sample house designs
  // const bedrooms = [3, 4];
  // const bathrooms = [1, 2, 3];
  // const garages = [1, 2, 3];
  // const rumpusOptions = [true, false];
  // const alfrescoOptions = [true, false];
  // const pergolaOptions = [true, false];

  // for (const br of bedrooms) {
  //   for (const ba of bathrooms) {
  //     for (const ga of garages) {
  //       for (const rumpus of rumpusOptions) {
  //         for (const alfresco of alfrescoOptions) {
  //           for (const pergola of pergolaOptions) {
  //             await prisma.floorPlan.create({
  //               data: {
  //                 name: `${br}BR ${ba}BA ${ga}GA House`,
  //                 floorplanUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/floorplan1.jpeg',
  //                 bedrooms: br,
  //                 bathrooms: ba,
  //                 garages: ga,
  //                 areaSqm: Math.floor(Math.random() * (1000 - 200 + 1)) + 200,
  //                 minLotWidth: 12.0,
  //                 minLotDepth: 15.0,
  //                 rumpus,
  //                 alfresco,
  //                 pergola
  //               }
  //             });
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  // for (const br of bedrooms) {
  //   for (const ba of bathrooms) {
  //     for (const ga of garages) {
  //       for (const rumpus of rumpusOptions) {
  //         for (const alfresco of alfrescoOptions) {
  //           for (const pergola of pergolaOptions) {
  //             await prisma.floorPlan.create({
  //               data: {
  //                 name: `${br}BR ${ba}BA ${ga}GA House`,
  //                 floorplanUrl: '/floorplans/floorplan.png',
  //                 bedrooms: br,
  //                 bathrooms: ba,
  //                 garages: ga,
  //                 areaSqm: Math.floor(Math.random() * (1000 - 200 + 1)) + 200,
  //                 minLotWidth: 12.0,
  //                 minLotDepth: 15.0,
  //                 rumpus,
  //                 alfresco,
  //                 pergola
  //               }
  //             });
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
  
  console.log('✅ Sample data created successfully!');

}

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
