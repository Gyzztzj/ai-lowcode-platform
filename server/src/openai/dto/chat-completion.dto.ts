import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ChatCompletionRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}

class ChatMessageContentPartText {
  @IsString()
  type: 'text';

  @IsString()
  text: string;
}

class ChatMessageContentPartImageUrl {
  url: string;
  detail?: 'low' | 'high' | 'auto';
}

class ChatMessageContentPartImage {
  @IsString()
  type: 'image_url';

  @IsObject()
  image_url: ChatMessageContentPartImageUrl;
}

class ChatMessage {
  @IsEnum(ChatCompletionRole)
  role: ChatCompletionRole;

  @IsOptional()
  @IsString()
  content?:
    | string
    | Array<ChatMessageContentPartText | ChatMessageContentPartImage>;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tool_calls?: any;

  @IsOptional()
  @IsString()
  tool_call_id?: string;
}

export class ChatCompletionChoice {
  @IsInt()
  index: number;

  @IsObject()
  message: {
    role: string;
    content?: string;
    tool_calls?: any;
  };

  @IsString()
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

export class ChatCompletionUsage {
  @IsInt()
  prompt_tokens: number;

  @IsInt()
  completion_tokens: number;

  @IsInt()
  total_tokens: number;
}

export class ChatCompletionDto {
  @IsString()
  @IsOptional()
  model?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessage)
  messages: ChatMessage[];

  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  top_p?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  max_tokens?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_completion_tokens?: number;

  @IsBoolean()
  @IsOptional()
  stream?: boolean;

  @IsArray()
  @IsOptional()
  stop?: string | string[];

  @IsNumber()
  @Min(-2)
  @Max(2)
  @IsOptional()
  presence_penalty?: number;

  @IsNumber()
  @Min(-2)
  @Max(2)
  @IsOptional()
  frequency_penalty?: number;

  @IsObject()
  @IsOptional()
  logit_bias?: Record<string, number>;

  @IsString()
  @IsOptional()
  user?: string;

  @IsArray()
  @IsOptional()
  tools?: any[];

  @IsString()
  @IsOptional()
  tool_choice?: string | any;

  @IsBoolean()
  @IsOptional()
  parallel_tool_calls?: boolean;

  @IsString()
  @IsOptional()
  response_format?: any;

  @IsString()
  @IsOptional()
  appId?: string;

  @IsInt()
  @Min(1)
  @Max(128)
  @IsOptional()
  n?: number;
}
