import { MailController } from '@modules/mail/mail.controller';
import { MailService } from '@modules/mail/mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { Module } from '@nestjs/common';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';

const parsePort = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_FROM = 'BlockPlanner <mail@mail.blockplanner.com.au>';

const buildSmtpTransport = (config: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
}): SMTPTransport.Options => {
  const port = config.port ?? 587;
  return {
    host: config.host,
    port,
    secure: port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  } as SMTPTransport.Options;
};

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => {
        const defaultPort = parsePort(process.env.SMTP_PORT, 587);
        const lotcheckPort = parsePort(process.env.LOTCHECK_SMTP_PORT, 587);
        const lotcheckConfigured =
          Boolean(String(process.env.LOTCHECK_SMTP_HOST || '').trim()) &&
          Boolean(String(process.env.LOTCHECK_SMTP_USER || '').trim()) &&
          Boolean(String(process.env.LOTCHECK_SMTP_PASS || '').trim());

        const transports = lotcheckConfigured
          ? {
              lotcheck: buildSmtpTransport({
                host: process.env.LOTCHECK_SMTP_HOST,
                port: lotcheckPort,
                user: process.env.LOTCHECK_SMTP_USER,
                pass: process.env.LOTCHECK_SMTP_PASS,
              }),
            }
          : undefined;

        return {
          transport: buildSmtpTransport({
            host: process.env.SMTP_HOST,
            port: defaultPort,
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }),
          transports,
          defaults: {
            from: DEFAULT_FROM,
          },
          template: {
            dir: join(__dirname, '..', '..', 'templates'),
            adapter: new PugAdapter(),
            options: {
              strict: true,
            },
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
