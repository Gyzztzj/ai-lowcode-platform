import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../rate-limit/rate-limit.service';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (limit: number, windowSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<{
      limit: number;
      windowSeconds: number;
    }>(RATE_LIMIT_KEY, context.getHandler());

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let identifier: string;

    if (request.user) {
      identifier = `user:${request.user.id}`;
    } else if (request.ip) {
      identifier = `ip:${request.ip}`;
    } else {
      identifier = `global`;
    }

    await this.rateLimitService.enforceRateLimit(
      identifier,
      rateLimitOptions.limit,
      rateLimitOptions.windowSeconds,
    );

    return true;
  }
}
