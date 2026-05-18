import { IsString, IsOptional, IsDefined } from 'class-validator';
import { BaseFlowDto } from './flow-base.dto';

export class PreviewFlowDto extends BaseFlowDto {
  @IsString()
  @IsOptional()
  appId?: string;

  @IsString()
  @IsDefined()
  userInput: string;
}