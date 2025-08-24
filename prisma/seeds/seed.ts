import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  console.log('🌱 Seeding estate...');
  await prisma.estate.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Hamilton Rise Yass',
      logoUrl:
        'https://www.hamiltonriseyass.com.au/wp-content/uploads/2021/10/logo-768x82.png',
      themeColor: '#2F5D62',
      email: 'info@hamiltonriseyass.com.au',
      phone: '0417 710 772',
      address: '14 Mitchell St YASS NSW 2582',
    },
  });

  console.log('🌱 Seeding zoning rules...');
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
      appliesToZones: ['RZ1'],
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
      appliesToZones: ['RZ1'],
    },
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
      appliesToZones: ['RZ2'],
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
      appliesToZones: ['RZ2'],
    },
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
      appliesToZones: ['RZ3'],
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
      appliesToZones: ['RZ3'],
    },
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
      appliesToZones: ['RZ4'],
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
      appliesToZones: ['RZ4'],
    },
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
      appliesToZones: ['RZ5'],
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
      appliesToZones: ['RZ5'],
    },
  });

  console.log('🌱 Seeding floor plans...');
  const floorPlan1 = await prisma.floorPlan.create({
    data: {
      name: 'Modern 3BR House - 1 bath',
      floorplanUrl:
        'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/dev/floorPlans/floorplan1.jpeg',
      bedrooms: 3,
      bathrooms: 2,
      garages: 1,
      areaSqm: 150.0,
      minLotWidth: 12.0,
      minLotDepth: 15.0,
      rumpus: false,
      alfresco: true,
      pergola: false,
    },
  });

  const floorPlan2 = await prisma.floorPlan.create({
    data: {
      name: 'Modern 3BR House - 2 bath',
      floorplanUrl:
        'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/dev/floorPlans/floorplan2.jpeg',
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      areaSqm: 100.0,
      minLotWidth: 10.0,
      minLotDepth: 12.0,
      rumpus: false,
      alfresco: false,
      pergola: true,
    },
  });

  const floorPlan3 = await prisma.floorPlan.create({
    data: {
      name: 'Compact 3BR House',
      floorplanUrl:
        'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/dev/floorPlans/floorplan3.jpeg',
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      areaSqm: 100.0,
      minLotWidth: 10.0,
      minLotDepth: 12.0,
      rumpus: false,
      alfresco: false,
      pergola: true,
    },
  });

  console.log('🌱 Seeding facades...');
  await prisma.facade.create({
    data: {
      label: 'Modern Facade 1',
      imageUrl:
        'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/dev/facade/facade1.png',
      floorPlanId: floorPlan1.id,
    },
  });

  await prisma.facade.create({
    data: {
      label: 'Modern Facade 2',
      imageUrl:
        'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/dev/facade/facade2.png',
      floorPlanId: floorPlan2.id,
    },
  });

  await prisma.facade.create({
    data: {
      label: 'Compact House Facade',
      imageUrl:
        'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/dev/facade/facade3.png',
      floorPlanId: floorPlan3.id,
    },
  });

  console.log('🌱 Seeding builders...');
  await prisma.builder.create({
    data: {
      name: 'Beyond Himalaya Pty Ltd',
      email: 'info@beyondhimalayatech.com.au',
      phone: '+610435581311',
    },
  });

  console.log('✅ Seeding completed successfully!');

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
