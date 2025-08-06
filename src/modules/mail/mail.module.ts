import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { join } from 'path';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false, // true if port is 465
          service: 'Gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false, // optional for Gmail
          },
        } as SMTPTransport.Options,
        defaults: {
          from: process.env.FROM,
        },
        template: {
          dir: join(__dirname, '..', '..', 'templates'),
          adapter: new PugAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}