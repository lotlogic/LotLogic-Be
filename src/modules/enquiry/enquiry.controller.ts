import { BuilderService } from '@modules/builder/builder.service';
import { EnquiryService } from '@modules/enquiry/enquiry.service';
import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { LotService } from '@modules/lot/lot.service';
import { MailService } from '@modules/mail/mail.service';
import { BadRequestException, Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';

interface GetInTouchBody {
    address?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    company?: string;
    recaptchaToken?: string;
}

@Controller('enquiry')
export class EnquiryController {
    private readonly logger = new Logger(EnquiryController.name);

    constructor(
        private readonly enquiryService: EnquiryService,
        private readonly builderService: BuilderService,
        private readonly lotService: LotService,
        private readonly FloorPlanService: FloorPlanService,
        private readonly mailService: MailService
    ) { }

    @Post()
    async postEnquiryData(
        @Body('name') name: string,
        @Body('email') email: string,
        @Body('number') number: string,
        @Body('builders') builders: string[],
        @Body('comments') comments: string,
        @Body('lot_id') lot_id: number,
        @Body('house_design_id') house_design_id: string,
        @Body('facade_id') facade_id: string,
        @Body('hot_lead') hot_lead: boolean
    ) {
        await this.enquiryService.postEnquiry(
            name,
            email,
            number,
            comments,
            lot_id,
            house_design_id,
            facade_id,
            builders,
            hot_lead
        );
        const lotData = await this.lotService.findLot(lot_id);
        const houseDesignData = await this.FloorPlanService.getHouseDesignById(house_design_id);
        const builderData = await this.builderService.findByIds(builders);
        if(lotData && houseDesignData && builderData.length) {
            // Send individual emails to each builder
            for(const builder of builderData) {
                await this.mailService.sendEmail({
                    subject: hot_lead ? 'HOT LEAD: Lot Overview — Immediate Attention' : 'Lot Overview for Builder Selection',
                    template: 'builder-selection-email',
                    context: {
                        builderName: builder.name,
                        lotNumber: lotData.id,
                        lotAddress: lotData.address,
                        lotSize: lotData.areaSqm,
                        lotZoning: lotData.zoning,
                        lotStatus: lotData.lifecycleStage,
                        imageUrl: houseDesignData.floorplanUrl,
                        comments: comments,
                        hotLead: !!hot_lead

                    },
                    emailsList: builder.email,
                });
            }
        }
        return { message: "Posted"};
    }

    @Post('get-in-touch')
    async postGetInTouch(@Body() body: GetInTouchBody, @Req() req: Request) {
        const address = this.normalizeText(body.address);
        const name = this.normalizeText(body.name);
        const email = this.normalizeText(body.email).toLowerCase();
        const phone = this.normalizeText(body.phone);
        const message = this.normalizeText(body.message);
        const company = this.normalizeText(body.company);
        const recaptchaToken = this.normalizeText(body.recaptchaToken);

        if (!address) {
            throw new BadRequestException('address is required');
        }
        if (!email || !this.isValidEmail(email)) {
            throw new BadRequestException('A valid email is required');
        }
        if (!phone) {
            throw new BadRequestException('phone is required');
        }

        // Honeypot: humans should leave this field blank.
        if (company) {
            this.logger.warn(
                `Blocked get-in-touch spam submission (honeypot filled, email=${this.maskEmail(email)}, ip=${this.normalizeText(req.ip) || 'unknown'})`,
            );
            return { message: 'Enquiry submitted' };
        }

        await this.verifyRecaptchaIfConfigured(recaptchaToken, req.ip);

        const recipientEmail =
            this.normalizeText(process.env.GET_IN_TOUCH_RECIPIENT_EMAIL) || 'mitch@blockplanner.com.au';
        const subject = `Feasibility assessment enquiry — ${address}`;

        await this.mailService.sendEmailOrThrow({
            subject,
            template: 'feasibility-assessment-enquiry',
            context: {
                address,
                name: name || 'Not provided',
                email,
                phone,
                message: message || 'Not provided',
                submittedAt: new Date().toISOString(),
                sourceIp: this.normalizeText(req.ip) || 'unknown',
            },
            emailsList: recipientEmail,
        });

        return { message: 'Enquiry submitted' };
    }

    private normalizeText(value: unknown): string {
        return String(value || '').trim();
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
        const recaptchaSecret = this.normalizeText(process.env.RECAPTCHA_SECRET_KEY);
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
            const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                method: 'POST',
                body: requestBody,
            });

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

        const minScoreValue = this.normalizeText(process.env.RECAPTCHA_MIN_SCORE);
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
