import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ChatMessageRole {
  system = 'system',
  user = 'user',
  assistant = 'assistant',
}

export enum ChatModel {
  DOUBAO_3_5_PRO = 'doubao-3-5-pro',
  DOUBAO_SEED_2_0_PRO = 'doubao-seed-2-0-pro-260215',
  QWEN_MAX = 'qwen-max',
  QWEN_MAX_2025_03_25 = 'qwen-max-2025-03-25',
  QVQ_MAX_2025_03_25 = 'qvq-max-2025-03-25',
}

export class MessageDto {
  @IsEnum(ChatMessageRole)
  role: 'system' | 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatDto {
  @IsArray()
  messages: MessageDto[];

  @IsString()
  @IsOptional()
  model?: string;

  @IsBoolean()
  @IsOptional()
  stream?: boolean;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(4096)
  @IsOptional()
  max_tokens?: number;
}
