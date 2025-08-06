import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnquiryService {
    constructor(private prisma: PrismaService) {}

    async postEnquiry(
        name: string,
        email: string,
        number: string,
        comments: string,
        lot_id: string,
        house_design_id: string,
        facade_id: string,
        builder: string[]
    ) {
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
                const builders = builder.map((b: string) => {
                    return {
                        builderId: b,
                        enquiryId: enquiry.id
                    }})
                await tx.enquiryBuilder.createMany({ data: builders });;
            });
            } catch (error) {
            throw new Error('Transaction failed: ' + error.message);
            }
    }

}
