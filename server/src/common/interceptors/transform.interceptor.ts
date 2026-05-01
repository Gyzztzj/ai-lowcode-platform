import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorCode } from '../enums/error-code.enum';

export class ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: string;

  constructor(
    code: number = ErrorCode.SUCCESS,
    message: string = 'Success',
    data?: T,
  ) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data?: T, message: string = 'Success'): ApiResponse<T> {
    return new ApiResponse(ErrorCode.SUCCESS, message, data);
  }

  static error(
    code: number = ErrorCode.SYSTEM_ERROR,
    message: string = 'Error',
  ): ApiResponse<null> {
    return new ApiResponse(code, message, null);
  }
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof ApiResponse) {
          return data;
        }
        return ApiResponse.success(data);
      }),
    );
  }
}
