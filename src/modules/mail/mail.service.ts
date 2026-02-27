import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

type SendEmailParams = {
    subject: string;
    template: string;
    context: ISendMailOptions['context'];
    emailsList: string;
    attachments?: ISendMailOptions['attachments'];
    from?: string;
};

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) {}

    private parseEmailList(emailsList: string): string[] {
        return emailsList
            .split(',')
            .map((email) => email.trim())
            .filter(Boolean);
    }

    private resolveFromAddress(explicitFrom?: string): string {
        const from = String(explicitFrom || '').trim();
        if (from) {
            return from;
        }

        const fromName = String(process.env.SMTP_FROM_NAME || 'LotCheck').trim() || 'LotCheck';
        const fromEmail = String(process.env.SMTP_FROM || '').trim();
        return fromEmail ? `${fromName} <${fromEmail}>` : fromName;
    }

    private async sendToRecipientsOrThrow(params: SendEmailParams) {
        const emailArray = this.parseEmailList(params.emailsList);
        const fromAddress = this.resolveFromAddress(params.from);

        const emailPromises = emailArray.map(async (email) => {
            const sendMailParams = {
                to: email,
                from: fromAddress,
                subject: params.subject,
                template: params.template,
                context: params.context,
                attachments: params.attachments,
            };

            return await this.mailerService.sendMail(sendMailParams);
        });

        const responses = await Promise.all(emailPromises);
        this.logger.log(
            `Emails sent successfully to ${emailArray.length} recipients individually: ${emailArray.join(', ')}`,
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
    }) {
        try {
            // Parse the emails list (comma-separated string)
            const emailArray = params.emailsList.split(',').map(email => email.trim());
            
            // Send one email with BCC recipients
            const sendMailParams = {
                to: process.env.SMTP_FROM, // Send to yourself as primary recipient
                bcc: emailArray, // Use BCC for all builder emails
                from: process.env.SMTP_FROM,
                subject: params.subject,
                template: params.template,
                context: params.context,
                attachments: params.attachments,
            };
            
            const response = await this.mailerService.sendMail(sendMailParams);
            this.logger.log(
                `Email sent successfully to ${emailArray.length} recipients via BCC: ${emailArray.join(', ')}`,
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

