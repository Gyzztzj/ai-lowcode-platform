import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateAppDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsString()
  @IsOptional()
  defaultModel?: string;

  @IsString()
  @IsOptional()
  embeddingModel?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
