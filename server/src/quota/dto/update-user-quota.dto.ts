import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserQuotaDto {
  @ApiProperty({ description: '每日配额', example: 1000 })
  @IsInt()
  @Min(0)
  dailyQuota: number;

  @ApiProperty({ description: '每月配额', example: 30000 })
  @IsInt()
  @Min(0)
  monthlyQuota: number;
}
