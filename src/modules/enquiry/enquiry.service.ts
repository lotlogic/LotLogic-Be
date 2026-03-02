import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { EnquiryStatus, Prisma } from '@prisma/client';

@Injectable()
export class EnquiryService {
    constructor(private prisma: PrismaService) {}

    private parseOptionalBigInt(value: string | number | bigint | null | undefined, fieldName: string): bigint | null {
        const normalized = String(value ?? '').trim();
        if (!normalized) {
            return null;
        }
        if (!/^\d+$/.test(normalized)) {
            throw new BadRequestException(`${fieldName} must be a numeric id`);
        }
        try {
            return BigInt(normalized);
        } catch {
            throw new BadRequestException(`${fieldName} is invalid`);
        }
    }

    private parseBuilderIds(builderIds: string[]): bigint[] {
        const unique = new Set<string>();
        for (const rawId of builderIds) {
            const normalized = String(rawId ?? '').trim();
            if (!normalized) {
                continue;
            }
            if (!/^\d+$/.test(normalized)) {
                throw new BadRequestException(`builders contains a non-numeric id: ${normalized}`);
            }
            unique.add(normalized);
        }
        return Array.from(unique).map((id) => BigInt(id));
    }

    async postEnquiry(
        name: string,
        email: string,
        number: string,
        comments: string,
        lot_id: string | number | bigint | null | undefined,
        house_design_id: string | number | bigint | null | undefined,
        facade_id: string | number | bigint | null | undefined,
        builder: string[],
        hot_lead?: boolean
    ) {
        const lotId = this.parseOptionalBigInt(lot_id, 'lot_id');
        const floorPlanId = this.parseOptionalBigInt(house_design_id, 'house_design_id');
        const facadeId = this.parseOptionalBigInt(facade_id, 'facade_id');
        const builderIds = this.parseBuilderIds(builder);

        if (builderIds.length === 0) {
            throw new BadRequestException('At least one valid builder id is required');
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const existingBuilders = await tx.builder.findMany({
                    where: { id: { in: builderIds } },
                    select: { id: true },
                });

                if (existingBuilders.length === 0) {
                    throw new BadRequestException('No matching builders were found for the provided builders list');
                }

                const lotRecord = lotId
                    ? await tx.lot.findUnique({
                        where: { id: lotId },
                        select: { estateId: true },
                    })
                    : null;

                const enquiry = await tx.enquiry.create({
                    data: {
                        name: name,
                        email: email,
                        phone: number,
                        comments: comments,
                        hotLead: Boolean(hot_lead),
                        status: EnquiryStatus.PENDING,
                        estateId: lotRecord?.estateId ?? null,
                        lotId,
                        floorPlanId,
                        facadeId
                    }
                });
                const builders = existingBuilders.map((b) => {
                    return {
                        builderId: b.id,
                        enquiryId: enquiry.id
                    }})
                await tx.enquiryBuilder.createMany({ data: builders });;

                return {
                    enquiry,
                    builderIds: existingBuilders.map((item) => item.id.toString()),
                };
            });
            } catch (error: unknown) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new BadRequestException('Invalid lot_id, house_design_id, facade_id, or builders value');
                }
                if (error.code === 'P2002') {
                    throw new BadRequestException('Duplicate builder was supplied for this enquiry');
                }
            }

            const reason = error instanceof Error ? error.message : String(error);
            throw new BadRequestException(`Unable to save enquiry: ${reason}`);
            }
    }

}
