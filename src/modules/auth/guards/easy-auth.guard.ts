import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import {
  extractDisplayName,
  extractEmail,
  extractExternalAuthId,
  parseClientPrincipal,
} from '@/modules/auth/auth.utils';

@Injectable()
export class EasyAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = parseClientPrincipal(req);
    if (!principal) {
      throw new UnauthorizedException('Missing auth principal');
    }

    const externalAuthId = extractExternalAuthId(principal, req);
    if (!externalAuthId) {
      throw new UnauthorizedException('Missing auth identifier');
    }

    const user = await this.prisma.user.findUnique({
      where: { externalAuthId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('User not registered');
    }

    req.auth = {
      id: user.id,
      externalAuthId,
      email: user.email ?? extractEmail(principal),
      displayName: user.displayName ?? extractDisplayName(principal),
      role: user.role,
    };

    return true;
  }
}
