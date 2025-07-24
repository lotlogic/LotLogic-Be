"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignOnLotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DesignOnLotService = class DesignOnLotService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateCompatibility(lotId) {
        const lot = await this.prisma.lot.findUnique({
            where: { id: lotId },
            include: { lotZoningRules: { include: { zoningRule: true } } }
        });
        if (!lot)
            throw new common_1.NotFoundException('Lot not found');
        const zoningRule = lot.lotZoningRules[0]?.zoningRule;
        console.log(lot.lotZoningRules);
        if (!zoningRule)
            throw new common_1.NotFoundException('Zoning rules not found');
        const houseDesigns = await this.prisma.houseDesign.findMany();
        const result = [];
        for (const design of houseDesigns) {
            const fits = this.checkFit(lot, zoningRule, design);
            if (fits) {
                const geoProps = typeof lot.geojson === 'object' && lot.geojson && 'properties' in lot.geojson
                    ? lot.geojson.properties ?? {}
                    : {};
                result.push({
                    houseDesignId: design.id,
                    floorplanUrl: design.floorplanUrl,
                    spacing: {
                        front: zoningRule.minFrontSetback_m ?? null,
                        rear: zoningRule.minRearSetback_m ?? null,
                        side: zoningRule.minSideSetback_m ?? null
                    },
                    maxCoverageArea: lot.areaSqm * (zoningRule.minFSR ?? 0.5),
                    houseArea: design.areaSqm,
                    lotDimensions: {
                        width: geoProps?.width,
                        depth: geoProps?.depth
                    }
                });
                await this.prisma.designOnLot.upsert({
                    where: { lotId_houseDesignId: { lotId, houseDesignId: design.id } },
                    create: { lotId, houseDesignId: design.id, isCompatible: true, matchedFilters: {} },
                    update: { isCompatible: true, matchedFilters: {} }
                });
            }
        }
        return {
            lotId: lot.id,
            zoning: zoningRule.code,
            matches: result
        };
    }
    checkFit(lot, zoningRule, design) {
        const geoProps = typeof lot.geojson === 'object' && lot.geojson && 'properties' in lot.geojson
            ? lot.geojson.properties ?? {}
            : {};
        const width = geoProps?.width ?? 0;
        const depth = geoProps?.depth ?? 0;
        const area = lot.areaSqm;
        const usableWidth = width - 2 * (zoningRule.minSideSetback_m ?? 3);
        const usableDepth = depth - ((zoningRule.minFrontSetback_m ?? 4) + (zoningRule.minRearSetback_m ?? 6));
        const maxFSR = zoningRule.minFSR ?? 0.5;
        return (design.minLotWidth <= width &&
            design.minLotDepth <= depth &&
            design.areaSqm <= area * maxFSR &&
            design.areaSqm <= usableWidth * usableDepth);
    }
};
exports.DesignOnLotService = DesignOnLotService;
exports.DesignOnLotService = DesignOnLotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DesignOnLotService);
//# sourceMappingURL=design-on-lot.service.js.map