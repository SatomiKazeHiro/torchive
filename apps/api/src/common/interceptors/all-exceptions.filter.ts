import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      // 类型收窄
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        // 将 res 断言为安全类型
        const errObj = res as { message?: string | string[]; error?: string };
        // 取 message 或 error
        if (typeof errObj.message === 'string') {
          message = errObj.message;
        } else if (Array.isArray(errObj.message)) {
          message = errObj.message.join(', ');
        } else if (typeof errObj.error === 'string') {
          message = errObj.error;
        }
      }
    } else if (exception instanceof Error) {
      // 捕获普通 Error（如 SqliteError、TypeORMError）
      message = exception.message;
      // 可选：打印完整 stack
      //   this.logger.error(exception.stack || message);
      this.logger.error(exception);
    }

    response.status(status).json({
      error: {
        code: status,
        message,
      },
    });
  }
}
