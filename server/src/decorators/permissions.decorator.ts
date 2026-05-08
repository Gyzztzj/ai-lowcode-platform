/**
 * 权限装饰器
 */
import { SetMetadata } from '@nestjs/common';

export enum Permission {
  /**
   * 读取用户权限
   */
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',

  /**
   * 读取应用权限
   */
  READ_APPS = 'read:apps',
  WRITE_APPS = 'write:apps',
  DELETE_APPS = 'delete:apps',
  EXECUTE_APPS = 'execute:apps',

  /**
   * 读取知识权限
   */
  READ_KNOWLEDGE = 'read:knowledge',
  WRITE_KNOWLEDGE = 'write:knowledge',
  DELETE_KNOWLEDGE = 'delete:knowledge',

  /**
   * 读取审计权限
   */
  READ_AUDIT = 'read:audit',
  WRITE_AUDIT = 'write:audit',

  /**
   * 管理 API 密钥权限
   */
  MANAGE_API_KEYS = 'manage:api_keys',
  MANAGE_SETTINGS = 'manage:settings',
  MANAGE_QUOTAS = 'manage:quotas',

  /**
   * 读取模型权限
   */
  READ_MODELS = 'read:models',
  WRITE_MODELS = 'write:models',
  DELETE_MODELS = 'delete:models',

  /**
   * 管理员权限
   */
  ADMIN = 'admin',
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
