import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
