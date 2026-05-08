/**
 * JSON异常过滤器
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../common/enums/error-code.enum';
import { ApiResponse } from '../common/interceptors/transform.interceptor';

@Catch()
export class JsonExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(JsonExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 记录完整的错误堆栈
    this.logger.error(
      '捕获到异常:',
      exception instanceof Error ? exception.stack : exception,
    );

    response.setHeader('Content-Type', 'application/json');

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : typeof exceptionResponse === 'object' &&
              exceptionResponse !== null &&
              'message' in exceptionResponse
            ? String(exceptionResponse.message)
            : 'Internal server error';

      let code = ErrorCode.SYSTEM_ERROR;
      if (status === HttpStatus.UNAUTHORIZED) {
        code = ErrorCode.UNAUTHORIZED;
      } else if (status === HttpStatus.FORBIDDEN) {
        code = ErrorCode.PERMISSION_DENIED;
      } else if (status === HttpStatus.NOT_FOUND) {
        code = ErrorCode.RESOURCE_NOT_FOUND;
      } else if (status === HttpStatus.BAD_REQUEST) {
        code = ErrorCode.VALIDATION_ERROR;
      } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
        code = ErrorCode.RATE_LIMIT_EXCEEDED;
      }

      response.status(status).json(ApiResponse.error(code, message));
    } else {
      // 获取更详细的错误信息
      const errorMessage =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';

      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR, errorMessage));
    }
  }
}
