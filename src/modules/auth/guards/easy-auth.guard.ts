import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { ALLOW_UNREGISTERED_KEY } from '@/modules/auth/decorators/allow-unregistered.decorator';
import { user as UserModel } from '@prisma/client';
import {
  extractDisplayName,
  extractEmail,
  extractExternalAuthId,
  parseClientPrincipal,
} from '@/modules/auth/auth.utils';

@Injectable()
export class EasyAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const allowUnregistered = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNREGISTERED_KEY,
      [context.getHandler(), context.getClass()],
    );
    const principal = parseClientPrincipal(req);
    if (!principal) {
      throw new UnauthorizedException('Missing auth principal');
    }

    const externalAuthId = extractExternalAuthId(principal, req);
    if (!externalAuthId) {
      throw new UnauthorizedException('Missing auth identifier');
    }

    let user: UserModel | null = null;
    let missingUserTable = false;
    try {
      user = await this.prisma.user.findUnique({
        where: { externalAuthId },
      });
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'P2021') {
        missingUserTable = true;
      } else {
        throw error;
      }
    }

    if (!user || user.status !== 'ACTIVE') {
      if (!allowUnregistered) {
        throw new ForbiddenException(
          missingUserTable
            ? 'Auth tables missing; run migrations'
            : 'User not registered',
        );
      }

      req.auth = {
        id: 0n,
        externalAuthId,
        email: extractEmail(principal),
        displayName: extractDisplayName(principal),
        role: 'USER',
        registered: false,
      };

      return true;
    }

    req.auth = {
      id: user.id,
      externalAuthId,
      email: user.email ?? extractEmail(principal),
      displayName: user.displayName ?? extractDisplayName(principal),
      role: user.role,
      registered: true,
    };

    return true;
  }
}
