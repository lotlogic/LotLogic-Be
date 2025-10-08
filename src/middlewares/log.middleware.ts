import { logger } from '@/helper/logger';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as onFinished from 'on-finished';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        const startTime = Date.now();

        onFinished(res, () => {
            const duration = Date.now() - startTime;
            const { statusCode } = res;

            logger.log(`"method": "${method}", "url": "${originalUrl}", "status": "${statusCode}", "duration": "${duration}ms"`, {
                "parameters": {...req.params, ...req.query, ...req.body}
            });
        });
        next();
    }
}
