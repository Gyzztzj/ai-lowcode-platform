import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ModelType } from '../../entities/model-type.enum';

// 自定义转换装饰器：清理字符串中的多余引号和空格
const CleanString = () =>
  Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .trim()
        .replace(/^['"`]+|['"`]+$/g, '')
        .trim();
    }
    return value as unknown;
  });

export class UpdateModelDto {
  @CleanString()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @CleanString()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  modelId?: string;

  @CleanString()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  provider?: string;

  @IsEnum(ModelType)
  @IsOptional()
  type?: ModelType;

  @CleanString()
  @IsString()
  @IsOptional()
  apiKey?: string;

  @CleanString()
  @IsString()
  @IsUrl({ require_protocol: true, require_tld: false })
  @IsOptional()
  apiEndpoint?: string;

  @CleanString()
  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}
