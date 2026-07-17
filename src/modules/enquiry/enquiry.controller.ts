import { BuilderService } from '@modules/builder/builder.service';
import { EnquiryService } from '@modules/enquiry/enquiry.service';
import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { MailService } from '@modules/mail/mail.service';
import { MondayService } from '@modules/monday/monday.service';
import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

interface EnquiryBody {
  name?: string;
  email?: string;
  number?: string;
  builders?: string[] | string;
  comments?: string;
  lot_id?: string | number;
  house_design_id?: string | number;
  facade_id?: string | number;
  hot_lead?: boolean;
  journey_type?: string;
  finishes_level?: string;
}

interface GetInTouchBody {
  address?: string;
  name?: string;
  email?: string;
  phone?: string;
  intent?: string;
  message?: string;
  requestType?: string;
  ownsBlock?: string;
  jointDevelopment?: string;
  company?: string;
  recaptchaToken?: string;
}

type BuilderNotificationContext = {
  builderName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  lotNumber: string;
  lotAddress: string;
  lotSize: number | string;
  lotZoning: string;
  lotStatus: string;
  designName: string;
  selectedFacade: string;
  finishesLevel: string;
  comments: string;
  blockSecuredLabel: string;
  imageUrl?: string | null;
};

type EstateNotificationContext = {
  estateName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  lotNumber: string;
  lotAddress: string;
  lotSize: number | string;
  lotZoning: string;
  lotStatus: string;
  designName: string;
  selectedFacade: string;
  finishesLevel: string;
  comments: string;
  journeyLabel: string;
  summaryNote: string;
  imageUrl?: string | null;
};

const normalizeText = (value: unknown): string => String(value || '').trim();

@Controller('enquiry')
export class EnquiryController {
  private readonly logger = new Logger(EnquiryController.name);

  constructor(
    private readonly enquiryService: EnquiryService,
    private readonly builderService: BuilderService,
    private readonly floorPlanService: FloorPlanService,
    private readonly mailService: MailService,
    private readonly mondayService: MondayService,
  ) {}

  @Post()
  async postEnquiryData(@Body() body: EnquiryBody) {
    const normalizedBuilders = Array.isArray(body.builders)
      ? body.builders.map((item) => normalizeText(item)).filter(Boolean)
      : normalizeText(body.builders)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    const created = await this.enquiryService.postEnquiry({
      name: normalizeText(body.name),
      email: normalizeText(body.email),
      number: normalizeText(body.number),
      comments: normalizeText(body.comments),
      lot_id: body.lot_id,
      house_design_id: body.house_design_id,
      facade_id: body.facade_id,
      builders: normalizedBuilders,
      hot_lead: body.hot_lead,
      journey_type: normalizeText(body.journey_type),
      finishes_level: normalizeText(body.finishes_level),
    });

    const journeyType =
      normalizeText(created.enquiry.journeyType) || 'pricing_enquiry';
    const houseDesignData = created.enquiry.floorPlanId
      ? await this.floorPlanService.getHouseDesignById(
          created.enquiry.floorPlanId.toString(),
        )
      : null;
    const builderData =
      created.builderIds.length > 0
        ? await this.builderService.findByIds(created.builderIds)
        : [];

    const lotNumber =
      created.lot?.blockNumber != null
        ? String(created.lot.blockNumber)
        : created.enquiry.lotId?.toString() || 'Unknown';
    const lotAddress = created.lot?.address || 'Not provided';
    const lotSize = created.lot?.areaSqm ?? 'Not provided';
    const lotZoning = created.lot?.zoning || 'Not provided';
    const lotStatus = created.lot?.lifecycleStage || 'Not provided';
    const designName = houseDesignData?.name || 'Not provided';
    const selectedFacade =
      houseDesignData?.facades?.find(
        (facade) =>
          facade.id.toString() === created.enquiry.facadeId?.toString(),
      )?.label || 'Not selected';
    const finishesLevel =
      normalizeText(created.enquiry.finishesLevel).replace(/\b\w/g, (char) =>
        char.toUpperCase(),
      ) || 'Not selected';
    const imageUrl = houseDesignData?.floorplanUrl ?? null;
    const estateEmail = normalizeText(created.estateEmail);
    const estateName = normalizeText(created.estateName) || 'Estate sales team';

    if (journeyType === 'secure_block') {
      if (estateEmail) {
        const context: EstateNotificationContext = {
          estateName,
          buyerName: created.enquiry.name,
          buyerEmail: created.enquiry.email,
          buyerPhone: created.enquiry.phone,
          lotNumber,
          lotAddress,
          lotSize,
          lotZoning,
          lotStatus,
          designName,
          selectedFacade,
          finishesLevel: 'Not applicable',
          comments: normalizeText(created.enquiry.comments) || 'Not provided',
          journeyLabel: 'Secure this block',
          summaryNote:
            'Buyer wants to secure this block. Stripe deposit checkout is not active yet, so treat this as deposit intent and follow up directly.',
          imageUrl,
        };

        await this.mailService.sendEmail({
          subject: `Secure block enquiry for Lot ${lotNumber}`,
          template: 'estate-enquiry-email',
          context,
          emailsList: estateEmail,
          senderProfile: 'lotcheck',
        });
      }

      return { message: 'Posted' };
    }

    if (houseDesignData && builderData.length) {
      for (const builder of builderData) {
        const context: BuilderNotificationContext = {
          builderName: builder.name,
          buyerName: created.enquiry.name,
          buyerEmail: created.enquiry.email,
          buyerPhone: created.enquiry.phone,
          lotNumber,
          lotAddress,
          lotSize,
          lotZoning,
          lotStatus,
          designName,
          selectedFacade,
          finishesLevel,
          comments: normalizeText(created.enquiry.comments) || 'Not provided',
          blockSecuredLabel:
            'No. Pricing enquiry only - block not yet secured.',
          imageUrl,
        };

        await this.mailService.sendEmail({
          subject: `Pricing enquiry for Lot ${lotNumber}`,
          template: 'builder-selection-email',
          context,
          emailsList: builder.email,
          senderProfile: 'lotcheck',
        });
      }
    }

    if (estateEmail) {
      const context: EstateNotificationContext = {
        estateName,
        buyerName: created.enquiry.name,
        buyerEmail: created.enquiry.email,
        buyerPhone: created.enquiry.phone,
        lotNumber,
        lotAddress,
        lotSize,
        lotZoning,
        lotStatus,
        designName,
        selectedFacade,
        finishesLevel,
        comments: normalizeText(created.enquiry.comments) || 'Not provided',
        journeyLabel: 'Pricing enquiry',
        summaryNote:
          'Buyer has requested detailed pricing. The builder has been notified and will lead the follow-up. The block is not yet secured.',
        imageUrl,
      };

      await this.mailService.sendEmail({
        subject: `Pricing enquiry FYI for Lot ${lotNumber}`,
        template: 'estate-enquiry-email',
        context,
        emailsList: estateEmail,
        senderProfile: 'lotcheck',
      });
    }

    return { message: 'Posted' };
  }

  @Post('get-in-touch')
  async postGetInTouch(@Body() body: GetInTouchBody, @Req() req: Request) {
    const address = normalizeText(body.address);
    const name = normalizeText(body.name);
    const email = normalizeText(body.email).toLowerCase();
    const phone = normalizeText(body.phone);
    const intent = normalizeText(body.intent);
    const message = normalizeText(body.message);
    const requestType = normalizeText(body.requestType);
    const ownsBlock = normalizeText(body.ownsBlock);
    const jointDevelopment = normalizeText(body.jointDevelopment);
    const company = normalizeText(body.company);
    const recaptchaToken = normalizeText(body.recaptchaToken);

    if (!address) {
      throw new BadRequestException('address is required');
    }
    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('A valid email is required');
    }
    if (!phone) {
      throw new BadRequestException('phone is required');
    }

    if (company) {
      this.logger.warn(
        `Blocked get-in-touch spam submission (honeypot filled, email=${this.maskEmail(email)}, ip=${normalizeText(req.ip) || 'unknown'})`,
      );
      return { message: 'Enquiry submitted' };
    }

    await this.verifyRecaptchaIfConfigured(recaptchaToken, req.ip);

    if (this.mondayService.isProductLeadConfigured('contact_request')) {
      await this.mondayService.createProductLead('contact_request', {
        fullName: name,
        email,
        phone,
        address,
        requestType,
        intention: intent,
        ownsBlock,
        jointDevelopment,
        message,
        sourceApp: 'discover',
      });

      return { message: 'Enquiry submitted' };
    }

    const recipientEmail =
      normalizeText(process.env.GET_IN_TOUCH_RECIPIENT_EMAIL) ||
      'mitch@blockplanner.com.au';
    const subject = `Feasibility assessment enquiry — ${address}`;

    await this.mailService.sendEmailOrThrow({
      subject,
      template: 'feasibility-assessment-enquiry',
      context: {
        address,
        name: name || 'Not provided',
        email,
        phone,
        intent: intent || 'Not provided',
        message: message || 'Not provided',
        submittedAt: new Date().toISOString(),
        sourceIp: normalizeText(req.ip) || 'unknown',
      },
      emailsList: recipientEmail,
      senderProfile: 'blockplanner',
    });

    return { message: 'Enquiry submitted' };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return 'redacted';
    }
    const visible = Math.min(2, local.length);
    return `${local.slice(0, visible)}***@${domain}`;
  }

  private async verifyRecaptchaIfConfigured(
    recaptchaToken: string,
    remoteIp?: string,
  ): Promise<void> {
    const recaptchaSecret = normalizeText(process.env.RECAPTCHA_SECRET_KEY);
    if (!recaptchaSecret) {
      return;
    }

    if (!recaptchaToken) {
      throw new BadRequestException('recaptchaToken is required');
    }

    const requestBody = new URLSearchParams();
    requestBody.set('secret', recaptchaSecret);
    requestBody.set('response', recaptchaToken);
    if (remoteIp) {
      requestBody.set('remoteip', remoteIp);
    }

    let verification: {
      success?: boolean;
      score?: number;
      'error-codes'?: string[];
    };
    try {
      const response = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          body: requestBody,
        },
      );

      if (!response.ok) {
        throw new Error(`status=${response.status}`);
      }

      verification = (await response.json()) as {
        success?: boolean;
        score?: number;
        'error-codes'?: string[];
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to verify reCAPTCHA token: ${reason}`);
      throw new BadRequestException('Unable to verify recaptcha token');
    }

    if (!verification.success) {
      this.logger.warn(
        `Rejected get-in-touch submission due to failed reCAPTCHA verification (${(verification['error-codes'] || []).join(', ') || 'unknown'})`,
      );
      throw new BadRequestException('recaptcha verification failed');
    }

    const minScoreValue = normalizeText(process.env.RECAPTCHA_MIN_SCORE);
    const minScore = Number(minScoreValue);
    if (!Number.isNaN(minScore) && typeof verification.score === 'number') {
      if (verification.score < minScore) {
        this.logger.warn(
          `Rejected get-in-touch submission due to low reCAPTCHA score (${verification.score} < ${minScore})`,
        );
        throw new BadRequestException('recaptcha score too low');
      }
    }
  }
}
