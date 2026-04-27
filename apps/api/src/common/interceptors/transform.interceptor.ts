import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type ResponseEnvelope<T> = {
  data: T;
};

function isResponseEnvelope(value: unknown): value is ResponseEnvelope<unknown> {
  return value !== null && typeof value === 'object' && 'data' in value;
}

@Injectable()
export class TransformInterceptor
  implements NestInterceptor<unknown, ResponseEnvelope<unknown>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ResponseEnvelope<unknown>> {
    return next.handle().pipe(
      map((response) => {
        if (isResponseEnvelope(response)) {
          return response;
        }
        return { data: response };
      }),
    );
  }
}
