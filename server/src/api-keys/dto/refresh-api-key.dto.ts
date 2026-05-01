import { IsOptional, IsDateString, IsArray, IsString } from 'class-validator';

export class RefreshApiKeyDto {
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
