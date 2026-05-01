import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsStrongPassword } from '../validators/password-strength.validator';

export class RegisterDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '用户密码（至少8位，包含大小写字母、数字、特殊字符）',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @IsStrongPassword()
  password: string;

  @ApiPropertyOptional({
    description: '用户昵称',
    example: 'DemoUser',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @IsOptional()
  name?: string;
}
