import { SetMetadata } from '@nestjs/common';

export enum Permission {
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',

  READ_APPS = 'read:apps',
  WRITE_APPS = 'write:apps',
  DELETE_APPS = 'delete:apps',
  EXECUTE_APPS = 'execute:apps',

  READ_KNOWLEDGE = 'read:knowledge',
  WRITE_KNOWLEDGE = 'write:knowledge',
  DELETE_KNOWLEDGE = 'delete:knowledge',

  READ_AUDIT = 'read:audit',
  WRITE_AUDIT = 'write:audit',

  MANAGE_API_KEYS = 'manage:api_keys',
  MANAGE_SETTINGS = 'manage:settings',
  MANAGE_QUOTAS = 'manage:quotas',

  READ_MODELS = 'read:models',
  WRITE_MODELS = 'write:models',
  DELETE_MODELS = 'delete:models',

  ADMIN = 'admin',
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
