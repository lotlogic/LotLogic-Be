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
exports.EnquiryController = void 0;
const common_1 = require("@nestjs/common");
const enquiry_service_1 = require("./enquiry.service");
const mail_service_1 = require("../mail/mail.service");
const builder_service_1 = require("../builder/builder.service");
const lot_service_1 = require("../lot/lot.service");
const house_design_service_1 = require("../house-design/house-design.service");
let EnquiryController = class EnquiryController {
    enquiryService;
    builderService;
    lotService;
    houseDesignService;
    mailService;
    constructor(enquiryService, builderService, lotService, houseDesignService, mailService) {
        this.enquiryService = enquiryService;
        this.builderService = builderService;
        this.lotService = lotService;
        this.houseDesignService = houseDesignService;
        this.mailService = mailService;
    }
    async postEnquiryData(name, email, number, builders, comments, lot_id, house_design_id, facade_id) {
        await this.enquiryService.postEnquiry(name, email, number, comments, lot_id, house_design_id, facade_id, builders);
        const lotData = await this.lotService.findLot(lot_id);
        const houseDesignData = await this.houseDesignService.getHouseDesignById(house_design_id);
        const builderData = await this.builderService.findByIds(builders);
        if (lotData && houseDesignData && builderData.length) {
            await this.mailService.sendEmail({
                subject: 'Lot Overview for Builder Selection',
                template: 'builder-selection-email',
                context: {
                    builderName: "Concern",
                    lotNumber: lotData.id,
                    lotAddress: lotData.address,
                    lotSize: lotData.areaSqm,
                    lotZoning: "Residential",
                    lotStatus: "Available",
                    imageUrl: houseDesignData.floorplanUrl
                },
                emailsList: builderData.map((builder) => { return builder.email; }).toString(),
            });
        }
        return { message: "Posted" };
    }
};
exports.EnquiryController = EnquiryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('name')),
    __param(1, (0, common_1.Body)('email')),
    __param(2, (0, common_1.Body)('number')),
    __param(3, (0, common_1.Body)('builders')),
    __param(4, (0, common_1.Body)('comments')),
    __param(5, (0, common_1.Body)('lot_id')),
    __param(6, (0, common_1.Body)('house_design_id')),
    __param(7, (0, common_1.Body)('facade_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EnquiryController.prototype, "postEnquiryData", null);
exports.EnquiryController = EnquiryController = __decorate([
    (0, common_1.Controller)('enquiry'),
    __metadata("design:paramtypes", [enquiry_service_1.EnquiryService,
        builder_service_1.BuilderService,
        lot_service_1.LotService,
        house_design_service_1.HouseDesignService,
        mail_service_1.MailService])
], EnquiryController);
//# sourceMappingURL=enquiry.controller.js.map