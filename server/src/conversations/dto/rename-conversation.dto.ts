import { IsString, IsNotEmpty } from 'class-validator';

export class RenameConversationDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
