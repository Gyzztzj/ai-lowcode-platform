import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class QueryKnowledgeBaseDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold?: number;

  @IsOptional()
  @IsBoolean()
  useRerank?: boolean;
}

export class UploadDocumentDto {
  @IsString()
  knowledgeBaseId: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileType?: string;
}

export class RAGResponseDto {
  query: string;
  retrievalResults: Array<{
    content: string;
    documentName: string;
    documentId: string;
    similarity: number;
  }>;
  hasContext: boolean;
  timestamp: Date;
}
