import { Controller, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../decorators/permissions.decorator';
import { AuditService } from './audit.service';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'Get current user audit logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'success', required: false, type: Boolean })
  @Get('my-logs')
  async getMyLogs(@Req() req, @Query() query: any) {
    const { logs, total } = await this.auditService.find({
      userId: req.user.id,
      limit: query.limit ? parseInt(query.limit, 10) : 100,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      action: query.action,
      success:
        query.success !== undefined ? query.success === 'true' : undefined,
    });

    return {
      success: true,
      data: { logs, total },
    };
  }

  @ApiOperation({ summary: 'Get all audit logs (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resourceType', required: false, type: String })
  @ApiQuery({ name: 'success', required: false, type: Boolean })
  @Get('logs')
  @RequirePermissions(Permission.READ_AUDIT)
  async getAllLogs(@Query() query: any) {
    const { logs, total } = await this.auditService.find({
      limit: query.limit ? parseInt(query.limit, 10) : 100,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      userId: query.userId,
      action: query.action,
      resourceType: query.resourceType,
      success:
        query.success !== undefined ? query.success === 'true' : undefined,
    });

    return {
      success: true,
      data: { logs, total },
    };
  }

  @ApiOperation({ summary: 'Get audit statistics (admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Get('stats')
  @RequirePermissions(Permission.READ_AUDIT)
  async getStats(@Query() query: any) {
    const stats = await this.auditService.getStats({
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      data: stats,
    };
  }

  @ApiOperation({ summary: 'Export audit logs (admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @Get('export')
  @RequirePermissions(Permission.READ_AUDIT)
  async exportLogs(@Query() query: any, @Res() res: Response) {
    const { logs } = await this.auditService.find({
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      userId: query.userId,
      action: query.action,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=audit-logs.json',
    );
    res.send(JSON.stringify(logs, null, 2));
  }

  @ApiOperation({ summary: 'Get logs by resource' })
  @ApiQuery({ name: 'resourceType', required: true, type: String })
  @ApiQuery({ name: 'resourceId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @Get('resource-logs')
  @RequirePermissions(Permission.READ_AUDIT)
  async getResourceLogs(@Query() query: any) {
    const { logs, total } = await this.auditService.find({
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      limit: query.limit ? parseInt(query.limit, 10) : 100,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });

    return {
      success: true,
      data: { logs, total },
    };
  }
}
