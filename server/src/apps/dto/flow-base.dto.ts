import {
  IsArray,
  IsObject,
  ValidateNested,
  IsString,
  IsOptional,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FlowNodeDto {
  @IsString()
  @IsDefined()
  id: string;

  @IsString()
  @IsDefined()
  type: string;

  @IsObject()
  @IsOptional()
  position?: { x: number; y: number };

  @IsObject()
  @IsDefined()
  data: Record<string, any>;

  [key: string]: any;
}

export class FlowEdgeDto {
  @IsString()
  @IsDefined()
  id: string;

  @IsString()
  @IsDefined()
  source: string;

  @IsString()
  @IsDefined()
  target: string;

  @IsString()
  @IsOptional()
  sourceHandle?: string;

  @IsString()
  @IsOptional()
  targetHandle?: string;

  [key: string]: any;
}

export class BaseFlowDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  nodes: FlowNodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowEdgeDto)
  edges: FlowEdgeDto[];
}