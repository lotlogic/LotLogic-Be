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
            // Parse the emails list (comma-separated string)
            const emailArray = params.emailsList.split(',').map(email => email.trim());
            
            // Send individual emails to each recipient
            const emailPromises = emailArray.map(async (email) => {
                const sendMailParams = {
                    to: email, // Send to individual builder
                    from: process.env.SMTP_FROM,
                    subject: params.subject,
                    template: params.template,
                    context: params.context,
                };
                
                return await this.mailerService.sendMail(sendMailParams);
            });
            
            // Wait for all emails to be sent
            const responses = await Promise.all(emailPromises);
            
            this.logger.log(
                `Emails sent successfully to ${emailArray.length} recipients individually: ${emailArray.join(', ')}`,
                responses,
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

    // Alternative method using BCC (sends one email with BCC recipients)
    async sendEmailWithBCC(params: {
        subject: string;
        template: string;
        context: ISendMailOptions['context'];
        emailsList: string;
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