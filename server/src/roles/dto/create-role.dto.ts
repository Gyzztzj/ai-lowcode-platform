import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '权限列表', example: ['app:create', 'app:read'] })
  @IsArray()
  permissions: string[];

  @ApiProperty({ description: '是否为系统角色', default: false })
  @IsOptional()
  isSystem?: boolean;
}
