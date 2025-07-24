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
exports.DesignOnLotController = void 0;
const common_1 = require("@nestjs/common");
const design_on_lot_service_1 = require("./design-on-lot.service");
let DesignOnLotController = class DesignOnLotController {
    designOnLotService;
    constructor(designOnLotService) {
        this.designOnLotService = designOnLotService;
    }
    async calculate(lotId) {
        return await this.designOnLotService.calculateCompatibility(lotId);
    }
};
exports.DesignOnLotController = DesignOnLotController;
__decorate([
    (0, common_1.Get)('calculate'),
    __param(0, (0, common_1.Query)('lotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DesignOnLotController.prototype, "calculate", null);
exports.DesignOnLotController = DesignOnLotController = __decorate([
    (0, common_1.Controller)('design-on-lot'),
    __metadata("design:paramtypes", [design_on_lot_service_1.DesignOnLotService])
], DesignOnLotController);
//# sourceMappingURL=design-on-lot.controller.js.map