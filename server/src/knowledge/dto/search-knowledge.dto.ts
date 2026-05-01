import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class SearchKnowledgeDto {
  @IsString()
  query: string;

  @IsUUID()
  knowledgeBaseId: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  topK?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  topN?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  threshold?: number;
}
