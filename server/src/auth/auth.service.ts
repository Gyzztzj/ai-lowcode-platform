import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, RefreshToken, PasswordResetToken } from '../entities';

@Injectable()
export class AuthService {
  private readonly bcryptLib = bcrypt as unknown as {
    hash: (text: string, rounds: number) => Promise<string>;
    compare: (text: string, hashed: string) => Promise<boolean>;
  };

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    const hashedPassword = await this.bcryptLib.hash(registerDto.password, 10);

    const newUser = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
    });
    const savedUser = await this.userRepository.save(newUser);

    const user = {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
    };

    const tokens = await this.generateTokens(savedUser.id, savedUser.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await this.bcryptLib.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    await this.refreshTokenRepository.update(storedToken.id, { revoked: true });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
    );

    return tokens;
  }

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {
    const { email } = requestPasswordResetDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      await this.passwordResetTokenRepository.update(
        { userId: user.id, used: false },
        { used: true },
      );

      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const passwordResetToken = this.passwordResetTokenRepository.create({
        token,
        userId: user.id,
        expiresAt,
      });

      await this.passwordResetTokenRepository.save(passwordResetToken);

      return {
        message: '密码重置链接已发送（在实际应用中，这里会发送邮件）',
        token,
      };
    }

    return {
      message: '如果邮箱存在，密码重置链接已发送',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const passwordResetToken = await this.passwordResetTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (
      !passwordResetToken ||
      passwordResetToken.used ||
      passwordResetToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('无效或已过期的重置令牌');
    }

    const hashedPassword = await this.bcryptLib.hash(newPassword, 10);

    await this.userRepository.update(passwordResetToken.user.id, {
      password: hashedPassword,
    });

    await this.passwordResetTokenRepository.update(passwordResetToken.id, {
      used: true,
    });

    await this.refreshTokenRepository.update(
      { userId: passwordResetToken.user.id, revoked: false },
      { revoked: true },
    );

    return { message: '密码重置成功' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isPasswordValid = await this.bcryptLib.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('当前密码错误');
    }

    const hashedPassword = await this.bcryptLib.hash(newPassword, 10);

    await this.userRepository.update(userId, { password: hashedPassword });

    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );

    return { message: '密码修改成功' };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokenRepository.update(
        { token: refreshToken },
        { revoked: true },
      );
    } else {
      await this.refreshTokenRepository.update(
        { userId, revoked: false },
        { revoked: true },
      );
    }

    return { message: '登出成功' };
  }

  private async generateTokens(userId: string, email: string) {
    const expiresIn =
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') || '1h';
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: expiresIn as any },
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    const refreshTokenExpiresIn =
      this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') || '7d';
    const days = parseInt(refreshTokenExpiresIn);
    expiresAt.setDate(expiresAt.getDate() + days);

    const newRefreshToken = this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }
}
