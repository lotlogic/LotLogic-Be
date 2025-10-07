import { MailController } from '@modules/mail/mail.controller';
import { MailService } from '@modules/mail/mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';

@Module({
  imports: [MailerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const mailConfig = configService.get('mail');

    return {
      transport: {
        host: mailConfig.smtp_host,
        port: mailConfig.smtp_port,
        secure: mailConfig.smtp_port === 465,
        auth: {
          user: mailConfig.smtp_user,
          pass: mailConfig.smtp_pass,
        },
        tls: { rejectUnauthorized: false },
      } as SMTPTransport.Options,
      defaults: {
        from: `${mailConfig.smtp_from_name} <${mailConfig.smtp_from}>`,
      },
      template: {
        dir: join(__dirname, '..', '..', 'templates'),
        adapter: new PugAdapter(),
        options: { strict: true },
      },
    };
  },
}),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}