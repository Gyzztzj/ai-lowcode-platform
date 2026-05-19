import { SetMetadata } from '@nestjs/common';

export enum Permission {
  READ_USERS = 'read:users',
  READ_AUDIT = 'read:audit',
  MANAGE_ROLES = 'manage:roles',
  MANAGE_QUOTAS = 'manage:quotas',
  READ_MODELS = 'read:models',
  WRITE_MODELS = 'write:models',
  DELETE_MODELS = 'delete:models',
  ADMIN = 'admin',
}
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
