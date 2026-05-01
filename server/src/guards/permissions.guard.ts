import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  Permission,
} from '../decorators/permissions.decorator';
import { Role } from '../entities';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    const userPermissions = user.permissions || [];
    const userRole = user.role;

    if (userRole === Role.ADMIN || userPermissions.includes(Permission.ADMIN)) {
      return true;
    }

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
