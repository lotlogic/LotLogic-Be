import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { AdminEntraGraphService } from '@/modules/admin/admin-entra-graph.service';
import { UserRole, UserStatus } from '@prisma/client';
import { MailService } from '@/modules/mail/mail.service';

interface AdminInviteBody {
  email?: string;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  estateIds?: string[];
  redirectUrl?: string;
  sendInvitationMessage?: boolean;
}

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/invitations')
export class AdminInvitationsController {
  private readonly logger = new Logger(AdminInvitationsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: AdminEntraGraphService,
    private readonly mailService: MailService,
  ) {}

  @Post()
  @Roles('ADMIN')
  async invite(@Body() body: AdminInviteBody) {
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email is required');
    }

    const role = body.role || UserRole.USER;
    if (role !== UserRole.ADMIN && role !== UserRole.USER) {
      throw new BadRequestException('Invalid role');
    }

    const status = body.status || UserStatus.ACTIVE;
    if (status !== UserStatus.ACTIVE && status !== UserStatus.DISABLED) {
      throw new BadRequestException('Invalid status');
    }

    const redirectUrl =
      String(body.redirectUrl || process.env.ENTRA_INVITE_REDIRECT_URL || '').trim();
    if (!redirectUrl) {
      throw new BadRequestException(
        'Missing redirectUrl (or ENTRA_INVITE_REDIRECT_URL env var)',
      );
    }

    const estateIdsInput = body.estateIds;
    const estateIds =
      estateIdsInput === undefined
        ? null
        : (estateIdsInput || []).map((estateId) => parseBigIntId(estateId, 'estateId'));

    if (estateIds && estateIds.length > 0) {
      const existing = await this.prisma.estate.findMany({
        where: { id: { in: estateIds } },
        select: { id: true },
      });
      if (existing.length !== estateIds.length) {
        throw new BadRequestException('One or more estateIds do not exist');
      }
    }

    const invitation = await this.graph.inviteUser({
      email,
      redirectUrl,
      displayName: body.displayName,
      // We send our own custom invitation email from this backend.
      sendInvitationMessage: body.sendInvitationMessage ?? false,
    });

    if (!invitation.invitedUserId) {
      throw new BadRequestException(
        'Invitation succeeded but no invitedUserId was returned by Graph',
      );
    }
    if (!invitation.inviteRedeemUrl) {
      throw new BadRequestException(
        'Invitation succeeded but no inviteRedeemUrl was returned by Graph',
      );
    }

    const user = await this.prisma.user.upsert({
      where: { externalAuthId: invitation.invitedUserId },
      create: {
        externalAuthId: invitation.invitedUserId,
        email,
        displayName: body.displayName,
        role,
        status,
      },
      update: {
        email,
        displayName: body.displayName,
        role,
        status,
      },
    });

    if (estateIds !== null) {
      await this.prisma.$transaction(async (tx) => {
        await tx.userEstate.deleteMany({ where: { userId: user.id } });
        if (estateIds.length > 0) {
          await tx.userEstate.createMany({
            data: estateIds.map((estateId) => ({ userId: user.id, estateId })),
          });
        }
      });
    }

    const estates = await this.prisma.userEstate.findMany({
      where: { userId: user.id },
      include: {
        estate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { estateId: 'asc' },
    });

    const appName = String(process.env.SMTP_FROM_NAME || 'LotCheck').trim() || 'LotCheck';
    const inviteeName = String(body.displayName || '').trim() || email;
    const assignedEstateNames = estates
      .map((item) => item.estate?.name?.trim() || '')
      .filter(Boolean);

    let customEmailSent = true;
    let customEmailError: string | null = null;

    try {
      await this.mailService.sendEmailOrThrow({
        subject: `You're invited to ${appName}`,
        template: 'admin-invitation-email',
        context: {
          appName,
          inviteeName,
          inviteeEmail: email,
          inviteRedeemUrl: invitation.inviteRedeemUrl,
          redirectUrl,
          role,
          status,
          assignedEstateNames,
        },
        emailsList: email,
      });
    } catch (error) {
      customEmailSent = false;
      customEmailError = error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(
        `Invitation email failed for ${email}: ${customEmailError}`,
      );
    }

    return {
      invitation,
      customEmail: {
        sent: customEmailSent,
        error: customEmailError,
      },
      user: {
        id: user.id.toString(),
        externalAuthId: user.externalAuthId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
      estates: estates.map((item) => ({
        userId: item.userId.toString(),
        estateId: item.estateId.toString(),
        estateName: item.estate?.name ?? null,
      })),
    };
  }
}

