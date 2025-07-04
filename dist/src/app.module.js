"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const estate_module_1 = require("./modules/estate/estate.module");
const lot_module_1 = require("./modules/lot/lot.module");
const plan_module_1 = require("./modules/plan/plan.module");
const facade_module_1 = require("./modules/facade/facade.module");
const enquiry_module_1 = require("./modules/enquiry/enquiry.module");
const zoning_module_1 = require("./modules/zoning/zoning.module");
const geo_module_1 = require("./modules/geo/geo.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            estate_module_1.EstateModule,
            lot_module_1.LotModule,
            plan_module_1.PlanModule,
            facade_module_1.FacadeModule,
            enquiry_module_1.EnquiryModule,
            zoning_module_1.ZoningModule,
            geo_module_1.GeoModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map