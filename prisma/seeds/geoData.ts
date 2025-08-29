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
    const gepDatas = JSON.parse(fileContent);
    for (const data of gepDatas.features) {
        if (data.geo_type !== 'lot') {
            try {
                await prisma.geoData.create({
                data: {
                    name: data.name,
                    color: data.color,
                    coordinates: (data.coordinates).toString(),
                    geoType: data.geo_type,
                }
                });
            } catch (error) {
                console.error(`Error in ${data.toString()}: ${error}`);
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
