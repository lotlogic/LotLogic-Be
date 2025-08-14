import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  private transformValue(value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return value.map(item => this.transformValue(item));
    }
    if (value !== null && typeof value === 'object') {
      const transformed: Record<string, unknown> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          transformed[key] = this.transformValue((value as Record<string, unknown>)[key]);
        }
      }
      return transformed;
    }
    return value;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(data => this.transformValue(data))
    );
  }
}
