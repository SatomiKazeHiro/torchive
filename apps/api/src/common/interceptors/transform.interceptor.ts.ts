import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface SuccessResponse {
  data: unknown;
  meta?: Record<string, unknown>;
}

// 类型守卫函数
function isSuccessResponse(obj: unknown): obj is SuccessResponse {
  // 先判断 obj 是对象
  if (obj && typeof obj === 'object') {
    // 类型断言为 Record<string, unknown>，安全访问属性
    const record = obj as Record<string, unknown>;
    return 'data' in record && 'meta' in record;
  }
  return false;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (isSuccessResponse(result)) {
          return result;
        }
        return { data: result, meta: {} };
      }),
    );
  }
}
