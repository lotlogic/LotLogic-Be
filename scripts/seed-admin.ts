import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EXTERNAL_IDS = [
  'afa10103-2d29-415e-8333-c804cf65e0a2',
  '7736eab3-1608-4edb-b03c-c75a730ff706',
  '2c45e8ec-21c1-4b63-bd2b-4a9bddc03a62',
  '25ee743a-bbf0-4de8-8e32-8f442e92a155',
] as const;

async function main() {
  console.log('Seeding admin users...');

  const results = await prisma.$transaction(
    ADMIN_EXTERNAL_IDS.map((externalAuthId) =>
      prisma.user.upsert({
        where: { externalAuthId },
        create: {
          externalAuthId,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        update: {
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        select: { id: true, externalAuthId: true, role: true, status: true },
      }),
    ),
  );

  for (const user of results) {
    console.log(
      `- ${user.externalAuthId}: role=${user.role} status=${user.status} id=${user.id.toString()}`,
    );
  }

  console.log('Admin users seeded.');
}

main()
  .catch((error) => {
    console.error('Failed to seed admin users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

