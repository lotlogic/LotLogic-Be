import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BUILDER_SCOPE_KEY,
  BuilderScopeOptions,
} from '@/modules/auth/decorators/builder-scope.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';

function parseBigInt(value: unknown, fieldName: string): bigint {
  if (typeof value === 'bigint') return value;
  const raw = typeof value === 'number' ? String(value) : String(value ?? '');
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new BadRequestException(`Missing ${fieldName}`);
  }
  try {
    return BigInt(trimmed);
  } catch {
    throw new BadRequestException(`Invalid ${fieldName}`);
  }
}

@Injectable()
export class BuilderScopeGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<BuilderScopeOptions>(
      BUILDER_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = req.auth;
    if (!auth) {
      return false;
    }

    if (auth.role === 'ADMIN') {
      return true;
    }

    let builderId: bigint | null = null;

    if (options.builderIdParam) {
      builderId = parseBigInt(req.params?.[options.builderIdParam], options.builderIdParam);
    } else if (options.builderIdBody) {
      builderId = parseBigInt((req.body as Record<string, unknown>)?.[options.builderIdBody], options.builderIdBody);
    } else if (options.builderIdQuery) {
      builderId = parseBigInt(req.query?.[options.builderIdQuery], options.builderIdQuery);
    }

    if (
      !builderId &&
      (options.floorPlanIdParam ||
        options.floorPlanIdBody ||
        options.floorPlanIdQuery)
    ) {
      const floorPlanIdField =
        options.floorPlanIdParam ||
        options.floorPlanIdBody ||
        options.floorPlanIdQuery ||
        'floorPlanId';
      const floorPlanIdRaw = options.floorPlanIdParam
        ? req.params?.[options.floorPlanIdParam]
        : options.floorPlanIdBody
          ? (req.body as Record<string, unknown>)?.[options.floorPlanIdBody]
          : req.query?.[options.floorPlanIdQuery as string];
      const floorPlanId = parseBigInt(floorPlanIdRaw, floorPlanIdField);

      const floorPlan = await this.prisma.floorPlan.findUnique({
        where: { id: floorPlanId },
        select: { builderId: true },
      });

      if (!floorPlan?.builderId) {
        throw new BadRequestException('Floor plan not found');
      }

      builderId = floorPlan.builderId;
    }

    if (
      !builderId &&
      (options.facadeIdParam || options.facadeIdBody || options.facadeIdQuery)
    ) {
      const facadeIdField =
        options.facadeIdParam ||
        options.facadeIdBody ||
        options.facadeIdQuery ||
        'facadeId';
      const facadeIdRaw = options.facadeIdParam
        ? req.params?.[options.facadeIdParam]
        : options.facadeIdBody
          ? (req.body as Record<string, unknown>)?.[options.facadeIdBody]
          : req.query?.[options.facadeIdQuery as string];
      const facadeId = parseBigInt(facadeIdRaw, facadeIdField);

      const facade = await this.prisma.facade.findUnique({
        where: { id: facadeId },
        select: { floorPlan: { select: { builderId: true } } },
      });

      if (!facade?.floorPlan?.builderId) {
        throw new BadRequestException('Facade not found');
      }

      builderId = facade.floorPlan.builderId;
    }

    if (!builderId) {
      throw new BadRequestException('Unable to resolve builder scope');
    }

    const access = await this.prisma.builderUser.findUnique({
      where: {
        userId_builderId: {
          userId: auth.id,
          builderId,
        },
      },
      select: { userId: true },
    });

    return Boolean(access);
  }
}
