/**
 * API 密钥守卫
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  /**
   * 检查请求是否包含有效的 API 密钥
   * @param context 执行上下文
   * @returns 是否包含有效的 API 密钥
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未提供有效的 API 密钥');
    }

    const key = authHeader.substring(7);
    const result = await this.apiKeysService.validateKey(key);

    if (!result.valid || !result.user || !result.apiKey) {
      throw new UnauthorizedException('无效的 API 密钥');
    }

    request.user = result.user;
    request.apiKey = result.apiKey;

    await this.apiKeysService.recordUsage(result.apiKey.id);

    return true;
  }
}
