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
exports.HouseDesignService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let HouseDesignService = class HouseDesignService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFilteredHouseDesigns(bedroom, bathroom, car, min_size, max_size, rumpus, alfresco, pergola) {
        const houseDesigns = await this.prisma.houseDesign.findMany({
            where: {
                rumpus,
                alfresco,
                pergola,
                bedrooms: {
                    in: bedroom
                },
                bathrooms: {
                    in: bathroom
                },
                garages: {
                    in: car
                },
                areaSqm: {
                    gte: min_size,
                    lte: max_size
                }
            },
            include: {
                facades: true
            }
        });
        const filteredDesign = houseDesigns.map(house => {
            let images = house.facades.map(facade => {
                return {
                    src: facade.imageUrl,
                    faced: facade.label
                };
            });
            return {
                id: house.id,
                title: house.name,
                area: house.areaSqm,
                image: house.facades.length ? house.facades[0].imageUrl : "",
                images,
                bedrooms: house.bedrooms,
                bathrooms: house.bathrooms,
                cars: house.garages,
                isFavorite: false,
                floorPlanImage: house.floorplanUrl
            };
        });
        return filteredDesign;
    }
    async getHouseDesignById(house_design_id) {
        return await this.prisma.houseDesign.findUnique({
            where: {
                id: house_design_id
            }
        });
    }
};
exports.HouseDesignService = HouseDesignService;
exports.HouseDesignService = HouseDesignService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HouseDesignService);
//# sourceMappingURL=house-design.service.js.map