import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  ResourceManagementService,
  QuotaConfig,
  UsageState,
  SystemUsage,
} from './resource-management.service';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Resource Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resource-management')
export class ResourceManagementController {
  constructor(
    private readonly resourceManagementService: ResourceManagementService,
  ) {}

  @ApiOperation({ summary: 'Get current usage state' })
  @Get('usage/state')
  async getUsageState(
    @Req() req,
  ): Promise<{ success: boolean; data: UsageState & QuotaConfig }> {
    const state = await this.resourceManagementService.getUsageState(
      req.user.id,
    );
    return {
      success: true,
      data: state,
    };
  }

  @ApiOperation({ summary: 'Set user quota' })
  @ApiBody({
    description: 'Quota configuration',
    schema: {
      type: 'object',
      properties: {
        maxTokensPerDay: { type: 'number', nullable: true },
        maxRequestsPerMinute: { type: 'number', nullable: true },
        maxConcurrentRequests: { type: 'number', nullable: true },
      },
    },
  })
  @Patch('quota')
  @HttpCode(HttpStatus.OK)
  async setQuota(
    @Req() req,
    @Body() body: any,
  ): Promise<{ success: boolean; data: QuotaConfig }> {
    const quota = await this.resourceManagementService.setUserQuota(
      req.user.id,
      body,
    );
    return {
      success: true,
      data: quota,
    };
  }

  @ApiOperation({ summary: 'Get system-wide usage statistics' })
  @Get('usage/system')
  async getSystemUsage(): Promise<{ success: boolean; data: SystemUsage }> {
    const usage = await this.resourceManagementService.getSystemUsage();
    return {
      success: true,
      data: usage,
    };
  }
}
