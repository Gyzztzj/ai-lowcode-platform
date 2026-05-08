/**
 * 密码强度验证器
 */
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordStrength', async: false })
export class PasswordStrengthConstraint implements ValidatorConstraintInterface {
  /**
   * 验证密码强度
   * @param password 密码
   * @param _args 验证参数
   * @returns 是否符合密码强度要求
   */
  validate(password: string, _args: ValidationArguments) {
    if (!password) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    return (
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar &&
      hasMinLength
    );
  }

  /**
   * 获取默认验证消息
   * @param _args 验证参数
   * @returns 验证消息
   */
  defaultMessage(_args: ValidationArguments) {
    return '密码必须包含至少8个字符，包括大写字母、小写字母、数字和特殊字符';
  }
}

/**
 * 密码强度验证装饰器
 * @param validationOptions 验证选项
 * @returns 验证装饰器
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordStrengthConstraint,
    });
  };
}
