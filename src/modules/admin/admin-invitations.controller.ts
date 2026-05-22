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

type LotCheckInvitationScenario =
  | 'estate-team'
  | 'builder-estate'
  | 'builder-direct';

interface AdminInviteContextBody {
  scenario?: LotCheckInvitationScenario;
  estateName?: string;
}

interface AdminInviteBody {
  email?: string;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  estateIds?: string[];
  redirectUrl?: string;
  sendInvitationMessage?: boolean;
  inviteContext?: AdminInviteContextBody;
}

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/invitations')
export class AdminInvitationsController {
  private readonly logger = new Logger(AdminInvitationsController.name);
  private readonly lotCheckSupportEmail = 'support@lotcheck.com.au';

  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: AdminEntraGraphService,
    private readonly mailService: MailService,
  ) {}

  private resolveInviteeFirstName(displayName: string, email: string): string {
    const normalizedDisplayName = String(displayName || '').trim();
    if (normalizedDisplayName) {
      const first = normalizedDisplayName.split(/\s+/)[0];
      if (first) {
        return first;
      }
    }

    const localPart = String(email || '').split('@')[0]?.trim();
    if (localPart) {
      const normalizedLocal = localPart.replace(/[._-]+/g, ' ');
      const first = normalizedLocal.split(/\s+/)[0];
      if (first) {
        return first.charAt(0).toUpperCase() + first.slice(1);
      }
    }

    return 'there';
  }

  private resolveInvitationScenario(
    body: AdminInviteBody,
    assignedEstateNames: string[],
  ): LotCheckInvitationScenario {
    const explicitScenario = body.inviteContext?.scenario;
    if (
      explicitScenario === 'estate-team' ||
      explicitScenario === 'builder-estate' ||
      explicitScenario === 'builder-direct'
    ) {
      return explicitScenario;
    }

    if (assignedEstateNames.length > 0) {
      return 'estate-team';
    }

    return 'builder-direct';
  }

  private resolveInvitationSubject(
    scenario: LotCheckInvitationScenario,
    estateName: string,
  ): string {
    if (scenario === 'estate-team') {
      const subjectEstateName =
        estateName && estateName !== 'your estate' ? estateName : 'Your estate';
      return `"${subjectEstateName}" is live on LotCheck - here's how to get started`;
    }
    if (scenario === 'builder-estate') {
      return `You've been invited to list your plans on ${estateName}`;
    }
    return 'Welcome to LotCheck - your account is ready';
  }

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

    const inviteeName = String(body.displayName || '').trim() || email;
    const assignedEstateNames = estates
      .map((item) => item.estate?.name?.trim() || '')
      .filter(Boolean);
    const inviteeFirstName = this.resolveInviteeFirstName(inviteeName, email);
    const estateNameFromContext = String(body.inviteContext?.estateName || '').trim();
    const estateNameForCopy = estateNameFromContext || assignedEstateNames[0] || 'your estate';
    const invitationScenario = this.resolveInvitationScenario(body, assignedEstateNames);
    const invitationSubject = this.resolveInvitationSubject(
      invitationScenario,
      estateNameForCopy,
    );

    // Invitation flows are LotCheck-only (admin endpoints are not used by Free Assessment).
    let customEmailSent = true;
    let customEmailError: string | null = null;

    try {
      await this.mailService.sendEmailOrThrow({
        subject: invitationSubject,
        template: 'admin-invitation-email',
        context: {
          scenario: invitationScenario,
          inviteeFirstName,
          estateName: estateNameForCopy,
          inviteeEmail: email,
          inviteRedeemUrl: invitation.inviteRedeemUrl,
          supportEmail: this.lotCheckSupportEmail,
        },
        emailsList: email,
        senderProfile: 'lotcheck',
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
        scenario: invitationScenario,
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

