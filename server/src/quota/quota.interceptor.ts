import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { QuotaService } from './quota.service';

@Injectable()
export class QuotaInterceptor implements NestInterceptor {
  constructor(private quotaService: QuotaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new HttpException('用户未登录', HttpStatus.UNAUTHORIZED);
    }

    const appId = request.params?.appId || request.body?.appId || null;

    const result = await this.quotaService.checkQuota(user.id, appId);

    if (!result.allowed) {
      throw new HttpException(
        result.message || '配额已用尽',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.quotaService.consumeQuota(user.id, appId);

    return next.handle();
  }
}
