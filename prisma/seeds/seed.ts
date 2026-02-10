import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  console.log('🌱 Seeding estate...');
  await prisma.estate.upsert({
    where: { id: 1 },
    update: {
      jurisdiction: 'NSW',
    },
    create: {
      id: 1,
      name: 'Hamilton Rise Yass',
      jurisdiction: 'NSW',
      logoUrl:
        'https://www.hamiltonriseyass.com.au/wp-content/uploads/2021/10/logo-768x82.png',
      themeColor: '#2F5D62',
      email: 'info@hamiltonriseyass.com.au',
      phone: '0417 710 772',
      address: '14 Mitchell St YASS NSW 2582',
    },
  });

  console.log('🌱 Seeding state rule sets...');
  await prisma.stateRuleSet.upsert({
    where: {
      jurisdiction_version: {
        jurisdiction: 'NSW',
        version: 1,
      },
    },
    update: {
      name: 'NSW baseline v1',
      status: 'PUBLISHED',
      rules: {
        minFrontSetbackM: 4,
        minRearSetbackM: 3,
        minSideSetbackM: 0.9,
      },
      sourceUrl:
        'https://www.planning.nsw.gov.au/sites/default/files/2023-02/guide-to-complying-development.pdf',
      notes: 'Seed baseline only. Replace with policy-accurate values per release.',
    },
    create: {
      jurisdiction: 'NSW',
      version: 1,
      name: 'NSW baseline v1',
      status: 'PUBLISHED',
      rules: {
        minFrontSetbackM: 4,
        minRearSetbackM: 3,
        minSideSetbackM: 0.9,
      },
      sourceUrl:
        'https://www.planning.nsw.gov.au/sites/default/files/2023-02/guide-to-complying-development.pdf',
      notes: 'Seed baseline only. Replace with policy-accurate values per release.',
    },
  });

  await prisma.stateRuleSet.upsert({
    where: {
      jurisdiction_version: {
        jurisdiction: 'ACT',
        version: 1,
      },
    },
    update: {
      name: 'ACT baseline v1',
      status: 'PUBLISHED',
      rules: {
        minFrontSetbackM: 4,
        minRearSetbackM: 3,
        minSideSetbackM: 3,
      },
      notes: 'Seed baseline only. Replace with policy-accurate values per release.',
    },
    create: {
      jurisdiction: 'ACT',
      version: 1,
      name: 'ACT baseline v1',
      status: 'PUBLISHED',
      rules: {
        minFrontSetbackM: 4,
        minRearSetbackM: 3,
        minSideSetbackM: 3,
      },
      notes: 'Seed baseline only. Replace with policy-accurate values per release.',
    },
  });

  console.log('🌱 Seeding estate rule sets...');
  await prisma.estateRuleSet.upsert({
    where: {
      estateId_version: {
        estateId: 1,
        version: 1,
      },
    },
    update: {
      name: 'Hamilton Rise guidelines v1',
      status: 'PUBLISHED',
      rules: {
        minGfaM2: 170,
        maxStoreys: 2,
        maxBuildingHeightM: 10.5,
        lotAreaBands: [
          {
            label: '700-900sqm',
            minAreaSqm: 700,
            maxAreaSqm: 900,
            maxGfaM2: 380,
            maxSiteCoverageRatio: 0.5,
          },
          {
            label: '900-1500sqm',
            minAreaSqm: 900,
            maxAreaSqm: 1500,
            maxGfaM2: 430,
            maxSiteCoverageRatio: 0.4,
          },
          {
            label: '1500sqm+',
            minAreaSqm: 1500,
            maxGfaM2: 430,
            maxSiteCoverageRatio: 0.3,
          },
        ],
        requiresArchitecturalReview: true,
        architecturalNotes: [
          'Roof pitch minimum 22.5 degrees (single storey)',
          'Traditional Australian vernacular style',
          'Garages integrated within main roofline',
          'Service areas must not face Yass Valley Way',
        ],
      },
      notes: 'Seed baseline for conditional estate rules',
    },
    create: {
      estateId: 1,
      version: 1,
      name: 'Hamilton Rise guidelines v1',
      status: 'PUBLISHED',
      rules: {
        minGfaM2: 170,
        maxStoreys: 2,
        maxBuildingHeightM: 10.5,
        lotAreaBands: [
          {
            label: '700-900sqm',
            minAreaSqm: 700,
            maxAreaSqm: 900,
            maxGfaM2: 380,
            maxSiteCoverageRatio: 0.5,
          },
          {
            label: '900-1500sqm',
            minAreaSqm: 900,
            maxAreaSqm: 1500,
            maxGfaM2: 430,
            maxSiteCoverageRatio: 0.4,
          },
          {
            label: '1500sqm+',
            minAreaSqm: 1500,
            maxGfaM2: 430,
            maxSiteCoverageRatio: 0.3,
          },
        ],
        requiresArchitecturalReview: true,
        architecturalNotes: [
          'Roof pitch minimum 22.5 degrees (single storey)',
          'Traditional Australian vernacular style',
          'Garages integrated within main roofline',
          'Service areas must not face Yass Valley Way',
        ],
      },
      notes: 'Seed baseline for conditional estate rules',
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

  console.log('🌱 Seeding builders...');
  const builder1 = await prisma.builder.create({
    data: {
      name: 'Beyond Himalaya Pty Ltd',
      email: 'info@beyondhimalayatech.com.au',
      phone: '+610435581311',
    },
  });
  const builder2 = await prisma.builder.create({
    data: {
      name: 'Lotlogic BlockPlanner Pty Ltd',
      email: 'mitch@blockplanner.com.au',
      phone: '+61 401 637 961',
    },
  });

  await prisma.builderEstateApproval.upsert({
    where: { builderId_estateId: { builderId: builder1.id, estateId: 1 } },
    update: { status: 'APPROVED' },
    create: {
      builderId: builder1.id,
      estateId: 1,
      status: 'APPROVED',
    },
  });

  await prisma.builderEstateApproval.upsert({
    where: { builderId_estateId: { builderId: builder2.id, estateId: 1 } },
    update: { status: 'APPROVED' },
    create: {
      builderId: builder2.id,
      estateId: 1,
      status: 'APPROVED',
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
      builderId: builder1.id,
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
      builderId: builder1.id,
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
      builderId: builder2.id,
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
