import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { EnquiryStatus, Prisma } from '@prisma/client';
import {
  normalizeEnquiryFinishesLevelOrThrow,
  normalizeEnquiryJourneyTypeOrThrow,
} from '@/modules/enquiry/enquiry-journey';

export type CreateEnquiryInput = {
  name: string;
  email: string;
  number: string;
  comments?: string;
  lot_id?: string | number | bigint | null;
  house_design_id?: string | number | bigint | null;
  facade_id?: string | number | bigint | null;
  builders?: string[];
  hot_lead?: boolean;
  journey_type?: string | null;
  finishes_level?: string | null;
};

@Injectable()
export class EnquiryService {
  constructor(private prisma: PrismaService) {}

  private parseOptionalBigInt(
    value: string | number | bigint | null | undefined,
    fieldName: string,
  ): bigint | null {
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
        throw new BadRequestException(
          `builders contains a non-numeric id: ${normalized}`,
        );
      }
      unique.add(normalized);
    }
    return Array.from(unique).map((id) => BigInt(id));
  }

  async postEnquiry(input: CreateEnquiryInput) {
    const lotId = this.parseOptionalBigInt(input.lot_id, 'lot_id');
    const floorPlanId = this.parseOptionalBigInt(
      input.house_design_id,
      'house_design_id',
    );
    const facadeId = this.parseOptionalBigInt(input.facade_id, 'facade_id');
    const builderIds = this.parseBuilderIds(input.builders ?? []);
    const journeyType =
      normalizeEnquiryJourneyTypeOrThrow(input.journey_type) ??
      'pricing_enquiry';
    const finishesLevel = normalizeEnquiryFinishesLevelOrThrow(
      input.finishes_level,
    );

    if (journeyType === 'pricing_enquiry' && builderIds.length === 0) {
      throw new BadRequestException(
        'At least one valid builder id is required for pricing enquiries',
      );
    }

    if (journeyType === 'secure_block' && finishesLevel) {
      throw new BadRequestException(
        'finishes_level is only valid for pricing enquiries',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingBuilders =
          builderIds.length > 0
            ? await tx.builder.findMany({
                where: { id: { in: builderIds } },
                select: { id: true },
              })
            : [];

        if (
          builderIds.length > 0 &&
          existingBuilders.length !== builderIds.length
        ) {
          throw new BadRequestException(
            'One or more builders were not found for the provided builders list',
          );
        }

        const lotRecord = lotId
          ? await tx.lot.findUnique({
              where: { id: lotId },
              select: {
                estateId: true,
                blockNumber: true,
                address: true,
                areaSqm: true,
                zoning: true,
                lifecycleStage: true,
                estate: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            })
          : null;

        const enquiry = await tx.enquiry.create({
          data: {
            name: input.name,
            email: input.email,
            phone: input.number,
            comments: input.comments || '',
            journeyType,
            finishesLevel,
            hotLead: Boolean(input.hot_lead),
            status: EnquiryStatus.PENDING,
            estateId: lotRecord?.estateId ?? null,
            lotId,
            floorPlanId,
            facadeId,
          },
        });

        if (existingBuilders.length > 0) {
          await tx.enquiryBuilder.createMany({
            data: existingBuilders.map((builder) => ({
              builderId: builder.id,
              enquiryId: enquiry.id,
            })),
          });
        }

        return {
          enquiry,
          builderIds: existingBuilders.map((item) => item.id.toString()),
          estateEmail: lotRecord?.estate?.email ?? null,
          estateName: lotRecord?.estate?.name ?? null,
          lot: lotRecord,
        };
      });
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Invalid lot_id, house_design_id, facade_id, or builders value',
          );
        }
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Duplicate builder was supplied for this enquiry',
          );
        }
      }

      const reason = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Unable to save enquiry: ${reason}`);
    }
  }
}
