import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class FlowValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: false, // 不使用白名单，允许额外属性
      forbidNonWhitelisted: false, // 不禁止额外属性
    });
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => {
        return `${error.property} - ${Object.values(error.constraints || {}).join(', ')}`;
      });
      throw new Error(`验证失败: ${errorMessages.join('; ')}`);
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
