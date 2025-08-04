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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseDesignController = void 0;
const common_1 = require("@nestjs/common");
const house_design_service_1 = require("./house-design.service");
const lot_service_1 = require("../lot/lot.service");
const zoning_service_1 = require("../zoning/zoning.service");
let HouseDesignController = class HouseDesignController {
    houseDesignService;
    lotService;
    zoningService;
    constructor(houseDesignService, lotService, zoningService) {
        this.houseDesignService = houseDesignService;
        this.lotService = lotService;
        this.zoningService = zoningService;
    }
    async filterHouseDesign(lot_id, bedroom, bathroom, car, min_size, max_size, rumpus, alfresco, pergola) {
        const houseDesigns = await this.houseDesignService.getFilteredHouseDesigns(bedroom, bathroom, car, min_size, max_size, rumpus, alfresco, pergola);
        const lotDetail = await this.lotService.findLot(lot_id);
        const zoningDetail = await this.zoningService.getFilteredHouseDesigns(lotDetail ? lotDetail.zoning : "");
        if (lotDetail && zoningDetail) {
            const buildArea = (lotDetail.geojson) ? (lotDetail.geojson['properties'].width - (zoningDetail.minFrontSetback_m || 0) - (zoningDetail.minRearSetback_m || 0)) * (lotDetail.geojson['properties'].depth - (2 * (zoningDetail.minSideSetback_m || 0))) : 0;
            return houseDesigns.filter(design => design.area <= buildArea);
        }
        return [];
    }
};
exports.HouseDesignController = HouseDesignController;
__decorate([
    (0, common_1.Get)(":lot_id"),
    __param(0, (0, common_1.Param)('lot_id')),
    __param(1, (0, common_1.Body)('bedroom')),
    __param(2, (0, common_1.Body)('bathroom')),
    __param(3, (0, common_1.Body)('car')),
    __param(4, (0, common_1.Body)('min_size')),
    __param(5, (0, common_1.Body)('max_size')),
    __param(6, (0, common_1.Body)('rumpus')),
    __param(7, (0, common_1.Body)('alfresco')),
    __param(8, (0, common_1.Body)('pergola')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Array, Array, Number, Number, Boolean, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], HouseDesignController.prototype, "filterHouseDesign", null);
exports.HouseDesignController = HouseDesignController = __decorate([
    (0, common_1.Controller)('house-design'),
    __metadata("design:paramtypes", [house_design_service_1.HouseDesignService,
        lot_service_1.LotService,
        zoning_service_1.ZoningService])
], HouseDesignController);
//# sourceMappingURL=house-design.controller.js.map