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
exports.EnquiryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EnquiryService = class EnquiryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async postEnquiry(name, email, number, comments, lot_id, house_design_id, facade_id, builder) {
        try {
            await this.prisma.$transaction(async (tx) => {
                const enquiry = await tx.enquiry.create({
                    data: {
                        name: name,
                        email: email,
                        phone: number,
                        comments: comments,
                        lotId: lot_id,
                        houseDesignId: house_design_id,
                        facadeId: facade_id
                    }
                });
                const builders = builder.map((b) => {
                    return {
                        builderId: b,
                        enquiryId: enquiry.id
                    };
                });
                await tx.enquiryBuilder.createMany({ data: builders });
                ;
            });
        }
        catch (error) {
            throw new Error('Transaction failed: ' + error.message);
        }
    }
};
exports.EnquiryService = EnquiryService;
exports.EnquiryService = EnquiryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnquiryService);
//# sourceMappingURL=enquiry.service.js.map