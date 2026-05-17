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
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_3_5_TURBO_16K = 'gpt-3.5-turbo-16k',
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
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
