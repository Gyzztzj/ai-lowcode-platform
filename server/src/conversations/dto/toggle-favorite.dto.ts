import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleFavoriteDto {
  @IsBoolean()
  @IsOptional()
  favorite?: boolean;
}
