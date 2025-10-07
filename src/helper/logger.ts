// logger.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const logger = WinstonModule.createLogger({
    transports: [
        new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `[${level}] {${timestamp} ${context ? `${JSON.stringify(context)}` : ''}, ${message}, ${(metaStr)}`;
            }),
        ),
        })
    ],
});
