import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { TokenUsageService } from './token-usage.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('token-usage')
@UseGuards(JwtAuthGuard)
export class TokenUsageController {
  constructor(private readonly tokenUsageService: TokenUsageService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
    @Query('model') model?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tokenUsageService.findByUser(
      req.user.id,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
      {
        apiKeyId,
        appId,
        model,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    );
  }

  @Get('stats')
  async getStats(
    @Request() req,
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tokenUsageService.getUserStats(req.user.id, {
      apiKeyId,
      appId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('daily')
  async getDailyStats(
    @Request() req,
    @Query('days') days: string = '30',
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
  ) {
    return this.tokenUsageService.getDailyStats(
      req.user.id,
      parseInt(days, 10),
      { apiKeyId, appId },
    );
  }

  @Get('weekly')
  async getWeeklyStats(
    @Request() req,
    @Query('weeks') weeks: string = '12',
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
  ) {
    return this.tokenUsageService.getWeeklyStats(
      req.user.id,
      parseInt(weeks, 10),
      { apiKeyId, appId },
    );
  }

  @Get('monthly')
  async getMonthlyStats(
    @Request() req,
    @Query('months') months: string = '12',
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
  ) {
    return this.tokenUsageService.getMonthlyStats(
      req.user.id,
      parseInt(months, 10),
      { apiKeyId, appId },
    );
  }

  @Get('models')
  async getModelsStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tokenUsageService.getModelsStats(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('api-key/:apiKeyId/stats')
  async getApiKeyStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('apiKeyId') apiKeyId?: string,
  ) {
    return this.tokenUsageService.getApiKeyStats(
      req.user.id,
      apiKeyId || '',
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('cost')
  async getCostStats(
    @Request() req,
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tokenUsageService.getUserCostStats(req.user.id, {
      apiKeyId,
      appId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('cost/daily')
  async getDailyCostStats(
    @Request() req,
    @Query('days') days: string = '30',
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
  ) {
    return this.tokenUsageService.getDailyCostStats(
      req.user.id,
      parseInt(days, 10),
      { apiKeyId, appId },
    );
  }

  @Get('cost/monthly')
  async getMonthlyCostStats(
    @Request() req,
    @Query('months') months: string = '12',
    @Query('apiKeyId') apiKeyId?: string,
    @Query('appId') appId?: string,
  ) {
    return this.tokenUsageService.getMonthlyCostStats(
      req.user.id,
      parseInt(months, 10),
      { apiKeyId, appId },
    );
  }

  @Get('cost/models')
  async getModelCostStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tokenUsageService.getModelCostStats(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('cost/apps')
  async getAppCostStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.tokenUsageService.getAppCostStats(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
