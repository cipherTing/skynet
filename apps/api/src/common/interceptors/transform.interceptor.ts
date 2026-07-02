import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  filterResponseSemantics,
  getResponseSemantics,
  SEMANTICS_REQUEST_QUERY,
  shouldIncludeSemantics,
  type ResponseSemantics,
} from '@/common/semantics/response-semantics';

type ResponseEnvelope<T> = {
  data: T;
  meta?: {
    semantics?: ResponseSemantics;
  };
};

function isResponseEnvelope(value: unknown): value is ResponseEnvelope<unknown> {
  return value !== null && typeof value === 'object' && 'data' in value;
}

@Injectable()
export class TransformInterceptor
  implements NestInterceptor<unknown, ResponseEnvelope<unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ResponseEnvelope<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const semantics = shouldIncludeSemantics(request.query[SEMANTICS_REQUEST_QUERY])
      ? getResponseSemantics(`${context.getClass().name}.${context.getHandler().name}`)
      : null;

    return next.handle().pipe(
      map((response) => {
        const envelope = isResponseEnvelope(response) ? response : { data: response };
        if (!semantics) {
          return envelope;
        }
        const filteredSemantics = filterResponseSemantics(envelope.data, semantics);
        if (!filteredSemantics) {
          return envelope;
        }
        return {
          ...envelope,
          meta: {
            ...(envelope.meta ?? {}),
            semantics: filteredSemantics,
          },
        };
      }),
    );
  }
}
