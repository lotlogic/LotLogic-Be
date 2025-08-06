import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) {}

    async sendEmail(params: {
        subject: string;
        template: string;
        context: ISendMailOptions['context'];
        emailsList: string;
    }) {
        try {
            const sendMailParams = {
                to: params.emailsList,
                from: process.env.SMTP_FROM,
                subject: params.subject,
                template: params.template,
                context: params.context,
            };
            const response = await this.mailerService.sendMail(sendMailParams);
            this.logger.log(
                `Email sent successfully to recipients with the following parameters : ${JSON.stringify(
                    sendMailParams,
                )}`,
                response,
            );
        } catch (error) {
            this.logger.error(
                `Error while sending mail with the following parameters : ${JSON.stringify(
                    params,
                )}`,
                error,
            );
        }
    }
}