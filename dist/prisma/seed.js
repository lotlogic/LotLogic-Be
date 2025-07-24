"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma = new prisma_1.PrismaClient();
async function main() {
    const filePath = path_1.default.resolve(__dirname, '../src/prisma/data/ACTGOV_BLOCKS.geojson');
    const raw = fs_1.default.readFileSync(filePath, 'utf-8');
    const geo = JSON.parse(raw);
    const features = geo.features.slice(0, 100);
    for (const feature of features) {
        const props = feature.properties ?? {};
        const geometry = feature.geometry;
        const { BLOCK_KEY, BLOCK_NO, SECTION_NO, AREA_SQM, ZONING, OVERLAYS, BLOCK_ADDRESS, DISTRICT, DIVISION, LIFECYCLE_STAGE, } = props;
        await prisma.lot.create({
            data: {
                blockKey: typeof BLOCK_KEY === 'string'
                    ? BLOCK_KEY
                    : `missing-${Math.random()}`,
                blockNumber: BLOCK_NO ? parseInt(BLOCK_NO) : null,
                sectionNumber: SECTION_NO ? parseInt(SECTION_NO) : null,
                areaSqm: AREA_SQM ? parseFloat(AREA_SQM) : 0,
                zoning: typeof ZONING === 'string' ? ZONING : 'Unknown',
                overlays: typeof OVERLAYS === 'string' ? [OVERLAYS] : [],
                address: typeof BLOCK_ADDRESS === 'string' ? BLOCK_ADDRESS : null,
                district: typeof DISTRICT === 'string' ? DISTRICT : null,
                division: typeof DIVISION === 'string' ? DIVISION : null,
                lifecycleStage: typeof LIFECYCLE_STAGE === 'string' ? LIFECYCLE_STAGE : null,
                geojson: geometry,
            },
        });
    }
    console.log(`✅ Inserted ${features.length} features`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(() => {
    prisma.$disconnect().then(() => { });
});
//# sourceMappingURL=seed.js.map