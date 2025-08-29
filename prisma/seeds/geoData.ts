import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(
        __dirname,
        '../../src/data/hamiltonRiseMitchell.json',
    );
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lots = JSON.parse(fileContent);
    for (const lot of lots.features) {
        if (lot.geo_type !== 'lot') {
            try {
                await prisma.geoData.create({
                data: {
                    name: lot.name,
                    color: lot.color,
                    coordinates: lot.coordinates.toString(),
                    geoType: lot.geo_type,
                }
                });
            } catch (error) {
                console.error(`Error in ${lot.toString()}: ${error}`);
            }
        }
    }
    console.log('Geodata added');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
