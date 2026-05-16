import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuotaService } from './quota.service';
import { UpdateUserQuotaDto } from './dto/update-user-quota.dto';
import { UpdateAppQuotaDto } from './dto/update-app-quota.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../decorators/permissions.decorator';

@ApiTags('quota')
@Controller('quota')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户配额信息' })
  @ApiResponse({ status: 200, description: '用户配额信息' })
  @RequirePermissions(Permission.READ_USERS, Permission.MANAGE_QUOTAS)
  async getUserQuota(@Param('userId') userId: string) {
    return this.quotaService.getQuotaInfo(userId);
  }

  @Put('user/:userId')
  @ApiOperation({ summary: '更新用户配额' })
  @ApiResponse({ status: 200, description: '配额更新成功' })
  @RequirePermissions(Permission.MANAGE_QUOTAS)
  async updateUserQuota(
    @Param('userId') userId: string,
    @Body() updateUserQuotaDto: UpdateUserQuotaDto,
  ) {
    await this.quotaService.updateUserQuota(
      userId,
      updateUserQuotaDto.dailyQuota,
      updateUserQuotaDto.monthlyQuota,
    );
    return { message: '配额更新成功' };
  }

  @Put('app/:appId')
  @ApiOperation({ summary: '更新应用配额' })
  @ApiResponse({ status: 200, description: '配额更新成功' })
  @RequirePermissions(Permission.MANAGE_QUOTAS)
  async updateAppQuota(
    @Param('appId') appId: string,
    @Body() updateAppQuotaDto: UpdateAppQuotaDto,
  ) {
    await this.quotaService.updateAppQuota(
      appId,
      updateAppQuotaDto.dailyQuota ?? null,
      updateAppQuotaDto.monthlyQuota ?? null,
    );
    return { message: '配额更新成功' };
  }
}
