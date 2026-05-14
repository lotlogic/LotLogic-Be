import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { BuilderScopeGuard } from '@/modules/auth/guards/builder-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { BuilderScope } from '@/modules/auth/decorators/builder-scope.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

type FloorPlanIdInput =
  | bigint
  | number
  | string
  | { set?: bigint | number | string };

function resolveFloorPlanIdInput(value: unknown): bigint | undefined {
  if (value === undefined) return undefined;
  if (value && typeof value === 'object') {
    if ('set' in value) {
      return parseBigIntId((value as { set?: unknown }).set, 'floorPlanId');
    }
    throw new BadRequestException('floorPlanId cannot be updated');
  }
  return parseBigIntId(value, 'floorPlanId');
}

function unwrapSetInputValue(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'set')
  ) {
    return (value as { set?: unknown }).set;
  }
  return value;
}

function normalizeOptionalText(
  value: unknown,
  fieldName: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  const unwrapped = unwrapSetInputValue(value);
  if (unwrapped === undefined) return undefined;
  if (unwrapped === null) return null;
  if (typeof unwrapped !== 'string') {
    throw new BadRequestException(`${fieldName} must be text.`);
  }
  const trimmed = unwrapped.trim();
  return trimmed || null;
}

function normalizeRequiredText(value: unknown, fieldName: string): string {
  const unwrapped = unwrapSetInputValue(value);
  if (typeof unwrapped !== 'string' || !unwrapped.trim()) {
    throw new BadRequestException(`${fieldName} is required.`);
  }
  return unwrapped.trim();
}

function normalizeFileSizeInput(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  const unwrapped = unwrapSetInputValue(value);
  if (unwrapped === undefined) return undefined;
  if (unwrapped === null || unwrapped === '') return null;
  const parsed = Number(unwrapped);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    throw new BadRequestException(
      'fileSizeBytes must be a non-negative whole number.',
    );
  }
  return parsed;
}

@UseGuards(EasyAuthGuard, RolesGuard, BuilderScopeGuard)
@Controller('admin/floor-plans/:floorPlanId/documents')
export class AdminFloorPlanDocumentController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async findAll(@Param('floorPlanId') floorPlanId: string) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    return this.prisma.floorPlanDocument.findMany({
      where: { floorPlanId: floorPlanIdParsed },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async findOne(
    @Param('floorPlanId') floorPlanId: string,
    @Param('id') id: string,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const documentIdParsed = parseBigIntId(id, 'id');
    return this.prisma.floorPlanDocument.findFirst({
      where: { id: documentIdParsed, floorPlanId: floorPlanIdParsed },
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async create(
    @Param('floorPlanId') floorPlanId: string,
    @Body() data: Prisma.floorPlanDocumentUncheckedCreateInput,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const bodyFloorPlanId = resolveFloorPlanIdInput(
      data.floorPlanId as FloorPlanIdInput,
    );

    if (bodyFloorPlanId !== undefined && bodyFloorPlanId !== floorPlanIdParsed) {
      throw new BadRequestException('floorPlanId must match URL');
    }

    const documentName = normalizeOptionalText(
      data.documentName,
      'documentName',
    );
    const mimeType = normalizeOptionalText(data.mimeType, 'mimeType');
    const fileSizeBytes = normalizeFileSizeInput(data.fileSizeBytes);

    return this.prisma.floorPlanDocument.create({
      data: {
        floorPlanId: floorPlanIdParsed,
        fileName: normalizeRequiredText(data.fileName, 'fileName'),
        documentUrl: normalizeRequiredText(data.documentUrl, 'documentUrl'),
        ...(documentName !== undefined ? { documentName } : {}),
        ...(fileSizeBytes !== undefined ? { fileSizeBytes } : {}),
        ...(mimeType !== undefined ? { mimeType } : {}),
      },
    });
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async update(
    @Param('floorPlanId') floorPlanId: string,
    @Param('id') id: string,
    @Body() data: Prisma.floorPlanDocumentUncheckedUpdateInput,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const documentIdParsed = parseBigIntId(id, 'id');
    const bodyFloorPlanId = resolveFloorPlanIdInput(
      data.floorPlanId as FloorPlanIdInput,
    );

    if (bodyFloorPlanId !== undefined && bodyFloorPlanId !== floorPlanIdParsed) {
      throw new BadRequestException('floorPlanId cannot be updated');
    }

    await this.ensureDocumentInFloorPlan(floorPlanIdParsed, documentIdParsed);

    const documentName = normalizeOptionalText(
      data.documentName,
      'documentName',
    );
    const mimeType = normalizeOptionalText(data.mimeType, 'mimeType');
    const fileSizeBytes = normalizeFileSizeInput(data.fileSizeBytes);

    const updateData: Prisma.floorPlanDocumentUncheckedUpdateInput = {
      ...(data.fileName !== undefined
        ? { fileName: normalizeRequiredText(data.fileName, 'fileName') }
        : {}),
      ...(data.documentUrl !== undefined
        ? {
            documentUrl: normalizeRequiredText(
              data.documentUrl,
              'documentUrl',
            ),
          }
        : {}),
      ...(documentName !== undefined ? { documentName } : {}),
      ...(fileSizeBytes !== undefined ? { fileSizeBytes } : {}),
      ...(mimeType !== undefined ? { mimeType } : {}),
    };

    return this.prisma.floorPlanDocument.update({
      where: { id: documentIdParsed },
      data: updateData,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async remove(
    @Param('floorPlanId') floorPlanId: string,
    @Param('id') id: string,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const documentIdParsed = parseBigIntId(id, 'id');

    await this.ensureDocumentInFloorPlan(floorPlanIdParsed, documentIdParsed);

    return this.prisma.floorPlanDocument.delete({
      where: { id: documentIdParsed },
    });
  }

  private async ensureDocumentInFloorPlan(
    floorPlanId: bigint,
    documentId: bigint,
  ) {
    const document = await this.prisma.floorPlanDocument.findFirst({
      where: { id: documentId, floorPlanId },
      select: { id: true },
    });
    if (!document) {
      throw new BadRequestException('Document not found for floor plan');
    }
  }
}
