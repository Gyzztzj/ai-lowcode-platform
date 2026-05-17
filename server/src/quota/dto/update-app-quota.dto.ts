import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAppQuotaDto {
  @ApiProperty({ description: '每日配额', example: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyQuota?: number | null;

  @ApiProperty({ description: '每月配额', example: 3000, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyQuota?: number | null;
}
