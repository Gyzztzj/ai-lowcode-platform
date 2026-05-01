import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  rateLimitRequests?: number;

  @IsOptional()
  @IsString()
  rateLimitWindow?: string;

  @IsOptional()
  @IsUUID()
  appId?: string;
}
