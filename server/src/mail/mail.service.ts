import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
  }

  async onModuleInit() {
    if (this.isProduction) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST'),
        port: this.configService.get<number>('MAIL_PORT'),
        secure: this.configService.get<boolean>('MAIL_SECURE') || false,
        auth: {
          user: this.configService.get<string>('MAIL_USER'),
          pass: this.configService.get<string>('MAIL_PASSWORD'),
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.logger.log('📧 Ethereal test account created:', {
        user: testAccount.user,
        pass: testAccount.pass,
        smtp: testAccount.smtp.host + ':' + testAccount.smtp.port,
        web: 'https://ethereal.email',
      });

      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    try {
      const info = await this.transporter.sendMail({
        to: email,
        from:
          this.configService.get<string>('MAIL_FROM') || 'no-reply@example.com',
        subject: '密码重置请求',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>密码重置</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1e293b; margin-bottom: 16px;">密码重置请求</h2>
              <p style="color: #475569; line-height: 1.6;">
                您收到这封邮件是因为您（或其他人）请求重置您的账户密码。
              </p>
              <p style="color: #475569; line-height: 1.6; margin: 16px 0;">
                请点击下方链接完成密码重置：
              </p>
              <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                重置密码
              </a>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">
                如果您没有请求此操作，请忽略此邮件。
              </p>
              <p style="color: #94a3b8; font-size: 14px;">
                此链接将在1小时后过期。
              </p>
            </div>
          </body>
          </html>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);

      if (!this.isProduction && info.messageId) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          this.logger.log(`📧 Email preview link: ${previewUrl}`);
        }
      }

      return info;
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }
}
