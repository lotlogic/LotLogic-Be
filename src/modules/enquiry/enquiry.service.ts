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
        lot_id: number,
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
                        lotId: lot_id ? BigInt(lot_id) : null,
                        houseDesignId: house_design_id ? BigInt(house_design_id) : null,
                        facadeId: facade_id ? BigInt(facade_id) : null
                    }
                });
                const builders = builder.map((b: string) => {
                    return {
                        builderId: BigInt(b),
                        enquiryId: enquiry.id
                    }})
                await tx.enquiryBuilder.createMany({ data: builders });;
            });
            } catch (error) {
            throw new Error('Transaction failed: ' + error.message);
            }
    }

}
