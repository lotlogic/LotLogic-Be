import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding house designs...');

  // Clear existing house designs
  await prisma.floorPlan.deleteMany();

  // Create house designs
  const houseDesigns = [
    {
      name: 'House Design One',
      floorplanUrl: '/floorplans/housedesign1.png',
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
    {
      name: 'House Design Two',
      floorplanUrl: '/floorplans/housedesign2.png',
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
    {
      name: 'House Design Three',
      floorplanUrl: '/floorplans/housedesign3.png',
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
      areaSqm: 200.0,
      minLotWidth: 15.0,
      minLotDepth: 20.0,
      rumpus: true,
      alfresco: true,
      pergola: true,
    },
  ];

  for (const design of houseDesigns) {
    await prisma.floorPlan.create({
      data: design,
    });
  }

  console.log('House designs seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
