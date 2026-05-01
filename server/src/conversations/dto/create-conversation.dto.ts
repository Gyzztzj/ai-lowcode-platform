import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  appId: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;
}
