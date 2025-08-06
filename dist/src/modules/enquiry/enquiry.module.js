"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryModule = void 0;
const common_1 = require("@nestjs/common");
const enquiry_controller_1 = require("./enquiry.controller");
const enquiry_service_1 = require("./enquiry.service");
const mail_service_1 = require("../mail/mail.service");
const builder_service_1 = require("../builder/builder.service");
const lot_service_1 = require("../lot/lot.service");
const house_design_service_1 = require("../house-design/house-design.service");
const prisma_module_1 = require("../../prisma/prisma.module");
let EnquiryModule = class EnquiryModule {
};
exports.EnquiryModule = EnquiryModule;
exports.EnquiryModule = EnquiryModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [enquiry_controller_1.EnquiryController],
        providers: [
            enquiry_service_1.EnquiryService,
            mail_service_1.MailService,
            builder_service_1.BuilderService,
            lot_service_1.LotService,
            house_design_service_1.HouseDesignService
        ],
    })
], EnquiryModule);
//# sourceMappingURL=enquiry.module.js.map