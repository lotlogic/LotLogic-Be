import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

const LOTCHECK_TRANSPORTER_NAME = 'lotcheck';
const SENDER_PROFILE_CONFIG = {
  blockplanner: {
    displayName: 'BlockPlanner',
    email: 'noreply@mail.blockplanner.com.au',
    transporterName: undefined,
  },
  lotcheck: {
    displayName: 'LotCheck',
    email: 'noreply@mail.lotcheck.com.au',
    transporterName: LOTCHECK_TRANSPORTER_NAME,
  },
} as const;

export type MailSenderProfile = keyof typeof SENDER_PROFILE_CONFIG;
const DEFAULT_SENDER_PROFILE: MailSenderProfile = 'blockplanner';

type SendEmailParams = {
  subject: string;
  template: string;
  context: ISendMailOptions['context'];
  emailsList: string;
  attachments?: ISendMailOptions['attachments'];
  senderProfile?: MailSenderProfile;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly lotcheckTransportConfigured =
    Boolean(String(process.env.LOTCHECK_SMTP_HOST || '').trim()) &&
    Boolean(String(process.env.LOTCHECK_SMTP_USER || '').trim()) &&
    Boolean(String(process.env.LOTCHECK_SMTP_PASS || '').trim());

  constructor(private readonly mailerService: MailerService) {}

  private parseEmailList(emailsList: string): string[] {
    return emailsList
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);
  }

  private resolveSenderProfile(senderProfile?: MailSenderProfile): MailSenderProfile {
    if (!senderProfile) {
      return DEFAULT_SENDER_PROFILE;
    }

    return SENDER_PROFILE_CONFIG[senderProfile] ? senderProfile : DEFAULT_SENDER_PROFILE;
  }

  private resolveFromAddress(senderProfile: MailSenderProfile): string {
    const profile = SENDER_PROFILE_CONFIG[senderProfile];
    return `${profile.displayName} <${profile.email}>`;
  }

  private resolveTransporterName(senderProfile: MailSenderProfile): string | undefined {
    const profile = SENDER_PROFILE_CONFIG[senderProfile];
    if (!profile.transporterName) {
      return undefined;
    }

    if (profile.transporterName === LOTCHECK_TRANSPORTER_NAME && !this.lotcheckTransportConfigured) {
      this.logger.warn(
        `${LOTCHECK_TRANSPORTER_NAME} SMTP override is not configured. Falling back to default SMTP transport for ${profile.email}.`,
      );
      return undefined;
    }

    return profile.transporterName;
  }

  private resolvePrimaryRecipient(senderProfile: MailSenderProfile): string {
    return SENDER_PROFILE_CONFIG[senderProfile].email;
  }

  private async sendToRecipientsOrThrow(params: SendEmailParams) {
    const emailArray = this.parseEmailList(params.emailsList);
    const senderProfile = this.resolveSenderProfile(params.senderProfile);
    const fromAddress = this.resolveFromAddress(senderProfile);
    const transporterName = this.resolveTransporterName(senderProfile);

    const emailPromises = emailArray.map(async (email) => {
      const sendMailParams: ISendMailOptions = {
        to: email,
        from: fromAddress,
        subject: params.subject,
        template: params.template,
        context: params.context,
        attachments: params.attachments,
      };
      if (transporterName) {
        sendMailParams.transporterName = transporterName;
      }

      return await this.mailerService.sendMail(sendMailParams);
    });

    const responses = await Promise.all(emailPromises);
    this.logger.log(
      `Emails sent successfully to ${emailArray.length} recipients individually (senderProfile=${senderProfile}): ${emailArray.join(
        ', ',
      )}`,
      responses,
    );
  }

  async sendEmail(params: SendEmailParams) {
    try {
      await this.sendToRecipientsOrThrow(params);
    } catch (error) {
      this.logger.error(
        `Error while sending mail with the following parameters : ${JSON.stringify(
          params,
        )}`,
        error,
      );
    }
  }

  async sendEmailOrThrow(params: SendEmailParams) {
    await this.sendToRecipientsOrThrow(params);
  }

  // Alternative method using BCC (sends one email with BCC recipients)
  async sendEmailWithBCC(params: {
    subject: string;
    template: string;
    context: ISendMailOptions['context'];
    emailsList: string;
    attachments?: ISendMailOptions['attachments'];
    senderProfile?: MailSenderProfile;
  }) {
    try {
      const emailArray = this.parseEmailList(params.emailsList);
      const senderProfile = this.resolveSenderProfile(params.senderProfile);
      const fromAddress = this.resolveFromAddress(senderProfile);
      const transporterName = this.resolveTransporterName(senderProfile);

      const sendMailParams: ISendMailOptions = {
        to: this.resolvePrimaryRecipient(senderProfile),
        bcc: emailArray,
        from: fromAddress,
        subject: params.subject,
        template: params.template,
        context: params.context,
        attachments: params.attachments,
      };
      if (transporterName) {
        sendMailParams.transporterName = transporterName;
      }

      const response = await this.mailerService.sendMail(sendMailParams);
      this.logger.log(
        `Email sent successfully to ${emailArray.length} recipients via BCC (senderProfile=${senderProfile}): ${emailArray.join(
          ', ',
        )}`,
        response,
      );
    } catch (error) {
      this.logger.error(
        `Error while sending mail with BCC: ${JSON.stringify(params)}`,
        error,
      );
    }
  }
}

