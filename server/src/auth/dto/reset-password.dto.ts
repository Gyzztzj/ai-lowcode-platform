import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password-strength.validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  @IsStrongPassword()
  newPassword: string;
}
