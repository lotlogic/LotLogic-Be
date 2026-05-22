import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ESTATE_SCOPE_KEY,
  EstateScopeOptions,
} from '@/modules/auth/decorators/estate-scope.decorator';
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
export class EstateScopeGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<EstateScopeOptions>(
      ESTATE_SCOPE_KEY,
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

    let estateId: bigint | null = null;

    if (options.estateIdParam) {
      estateId = parseBigInt(req.params?.[options.estateIdParam], options.estateIdParam);
    } else if (options.estateIdBody) {
      estateId = parseBigInt((req.body as Record<string, unknown>)?.[options.estateIdBody], options.estateIdBody);
    } else if (options.estateIdQuery) {
      estateId = parseBigInt(req.query?.[options.estateIdQuery], options.estateIdQuery);
    }

    if (!estateId && (options.lotIdParam || options.lotIdBody || options.lotIdQuery)) {
      const lotIdField = options.lotIdParam || options.lotIdBody || options.lotIdQuery || 'lotId';
      const lotIdRaw = options.lotIdParam
        ? req.params?.[options.lotIdParam]
        : options.lotIdBody
          ? (req.body as Record<string, unknown>)?.[options.lotIdBody]
          : req.query?.[options.lotIdQuery as string];
      const lotId = parseBigInt(lotIdRaw, lotIdField);

      const lot = await this.prisma.lot.findUnique({
        where: { id: lotId },
        select: { estateId: true },
      });

      if (!lot?.estateId) {
        throw new BadRequestException('Lot is not linked to an estate');
      }

      estateId = lot.estateId;
    }

    if (!estateId) {
      throw new BadRequestException('Unable to resolve estate scope');
    }

    const access = await this.prisma.userEstate.findUnique({
      where: {
        userId_estateId: {
          userId: auth.id,
          estateId,
        },
      },
      select: { userId: true },
    });

    return Boolean(access);
  }
}
