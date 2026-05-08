import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RerankModel {
  QWEN3_RERANK = 'qwen3-rerank',
  QWEN3_VL_RERANK = 'qwen3-vl-rerank',
  GTE_RERANK_V2 = 'gte-rerank-v2',
}

export class RerankDto {
  @IsString()
  query: string;

  @IsArray()
  @IsString({ each: true })
  documents: string[];

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  topN?: number;

  @IsBoolean()
  @IsOptional()
  returnDocuments?: boolean;

  @IsString()
  @IsOptional()
  instruct?: string;
}

export interface RerankResult {
  index: number;
  relevance_score: number;
  document?: string;
}
