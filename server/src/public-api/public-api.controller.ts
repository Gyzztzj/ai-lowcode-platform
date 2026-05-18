import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { AuditService } from '../audit/audit.service';
import { TokenUsageService } from '../token-usage/token-usage.service';
import { AppsService } from '../apps/apps.service';
import { FlowService } from '../flow/flow.service';
import { ContextManagerService } from '../context/context-manager.service';
import { OpenApiService } from './openapi.service';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Public API')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard, RateLimitGuard)
@Controller('api/v1')
export class PublicApiController {
  constructor(
    private readonly auditService: AuditService,
    private readonly tokenUsageService: TokenUsageService,
    private readonly appsService: AppsService,
    private readonly flowService: FlowService,
    private readonly contextManagerService: ContextManagerService,
    private readonly openApiService: OpenApiService,
  ) {}

  @ApiOperation({ summary: 'Execute workflow' })
  @ApiBody({
    description: 'Workflow execution request',
    schema: {
      type: 'object',
      properties: {
        appId: { type: 'string' },
        input: { type: 'string' },
        sessionId: { type: 'string', nullable: true },
        variables: { type: 'object', nullable: true },
      },
      required: ['appId', 'input'],
    },
  })
  @ApiResponse({ status: 200, description: 'Workflow executed successfully' })
  @Post('workflows/execute')
  @HttpCode(HttpStatus.OK)
  async executeWorkflow(@Req() req, @Body() body: any) {
    const startTime = Date.now();
    const apiKey = req.apiKey;

    try {
      const { appId, input, sessionId, variables } = body;

      const app = await this.appsService.findOne(appId, apiKey.userId);
      if (!app) {
        return {
          success: false,
          error: 'App not found',
        };
      }

      if (!app.nodes || !app.edges) {
        return {
          success: false,
          error: 'App workflow not configured',
        };
      }

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await this.contextManagerService.createSession(
          apiKey.userId,
          appId,
          { variables: variables || {} },
        );
        currentSessionId = session.sessionId;
      }

      const result = await this.flowService.executeFlow(
        app.nodes,
        app.edges,
        input,
        appId,
        apiKey.userId,
        { sessionId: currentSessionId },
      );

      await this.contextManagerService.saveExecutionContext(
        currentSessionId,
        result,
      );

      await this.auditService.log({
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        action: 'api.workflow.execute',
        resourceType: 'app',
        resourceId: appId,
        metadata: {
          sessionId: currentSessionId,
          durationMs: Date.now() - startTime,
        },
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        data: {
          result: result.result,
          sessionId: currentSessionId,
          executionLog: result.executionLog,
        },
      };
    } catch (error) {
      await this.auditService.log({
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        action: 'api.workflow.execute',
        resourceType: 'app',
        resourceId: body.appId,
        metadata: { error: (error as Error).message },
        success: false,
        errorMessage: (error as Error).message,
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  @ApiOperation({ summary: 'Get app information' })
  @Get('apps/:id')
  async getApp(@Req() req, @Param('id') id: string) {
    const app = await this.appsService.findOne(id, req.apiKey.userId);
    if (!app) {
      return { success: false, error: 'App not found' };
    }

    return {
      success: true,
      data: {
        id: app.id,
        name: app.name,
        description: app.description,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      },
    };
  }

  @ApiOperation({ summary: 'List all apps' })
  @Get('apps')
  async listApps(@Req() req) {
    const apps = await this.appsService.findAll(req.apiKey.userId);
    return {
      success: true,
      data: apps.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      })),
    };
  }

  @ApiOperation({ summary: 'Get session state' })
  @Get('sessions/:sessionId')
  async getSession(@Req() req, @Param('sessionId') sessionId: string) {
    const session = await this.contextManagerService.getSessionByUser(
      sessionId,
      req.apiKey.userId,
    );
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return {
      success: true,
      data: session,
    };
  }

  @ApiOperation({ summary: 'List user sessions' })
  @Get('sessions')
  async listSessions(
    @Req() req,
    @Query('appId') appId?: string,
    @Query('limit') limit: string = '50',
  ) {
    const sessions = await this.contextManagerService.getUserSessions(
      req.apiKey.userId,
      appId,
      parseInt(limit, 10),
    );

    return {
      success: true,
      data: sessions,
    };
  }

  @ApiOperation({ summary: 'Set session variable' })
  @Patch('sessions/:sessionId/variables')
  async setSessionVariable(
    @Req() req,
    @Param('sessionId') sessionId: string,
    @Body() body: { key: string; value: any },
  ) {
    const session = await this.contextManagerService.setVariable(
      sessionId,
      body.key,
      body.value,
    );

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return { success: true, data: session };
  }

  @ApiOperation({ summary: 'Delete session' })
  @Delete('sessions/:sessionId')
  async deleteSession(@Req() req, @Param('sessionId') sessionId: string) {
    await this.contextManagerService.deleteSession(sessionId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Get token usage statistics' })
  @Get('usage/tokens')
  async getTokenUsage(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const paginationDto = { page: 1, limit: 100 };
    const usageResult = await this.tokenUsageService.findByUser(
      req.apiKey.userId,
      paginationDto,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    );

    const totalTokens = usageResult.usages.reduce(
      (sum, u) => sum + u.totalTokens,
      0,
    );
    const promptTokens = usageResult.usages.reduce(
      (sum, u) => sum + u.promptTokens,
      0,
    );
    const completionTokens = usageResult.usages.reduce(
      (sum, u) => sum + u.completionTokens,
      0,
    );

    return {
      success: true,
      data: {
        totalTokens,
        promptTokens,
        completionTokens,
        records: usageResult.usages.length,
        usage: usageResult.usages,
      },
    };
  }

  @ApiOperation({ summary: 'Get audit logs' })
  @Get('audit/logs')
  async getAuditLogs(@Req() req, @Query('limit') limit: string = '100') {
    const logsResult = await this.auditService.findByUser(req.apiKey.userId, {
      limit: parseInt(limit, 10),
    });

    return {
      success: true,
      data: logsResult,
    };
  }

  @ApiOperation({ summary: 'Get OpenAPI specification' })
  @Get('openapi.json')
  async getOpenApiSpec(@Req() req) {
    const spec = await this.openApiService.generateOpenApiSpec(
      req.apiKey.userId,
    );
    return spec;
  }

  @ApiOperation({ summary: 'Get OpenAPI specification for specific app' })
  @Get('apps/:id/openapi.json')
  async getAppOpenApiSpec(@Req() req, @Param('id') id: string) {
    try {
      const spec = await this.openApiService.generateAppOpenApiSpec(
        id,
        req.apiKey.userId,
      );
      return spec;
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  @ApiOperation({ summary: 'Execute app directly' })
  @ApiBody({
    description: 'App execution request',
    schema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        sessionId: { type: 'string', nullable: true },
        variables: { type: 'object', nullable: true },
      },
      required: ['input'],
    },
  })
  @Post('apps/:id/execute')
  @HttpCode(HttpStatus.OK)
  async executeApp(@Req() req, @Param('id') id: string, @Body() body: any) {
    const startTime = Date.now();
    const apiKey = req.apiKey;

    try {
      const { input, sessionId, variables } = body;

      const app = await this.appsService.findOne(id, apiKey.userId);
      if (!app) {
        return {
          success: false,
          error: 'App not found',
        };
      }

      if (!app.nodes || !app.edges) {
        return {
          success: false,
          error: 'App workflow not configured',
        };
      }

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await this.contextManagerService.createSession(
          apiKey.userId,
          id,
          { variables: variables || {} },
        );
        currentSessionId = session.sessionId;
      }

      const result = await this.flowService.executeFlow(
        app.nodes,
        app.edges,
        input,
        id,
        apiKey.userId,
        { sessionId: currentSessionId },
      );

      await this.contextManagerService.saveExecutionContext(
        currentSessionId,
        result,
      );

      await this.auditService.log({
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        action: 'api.app.execute',
        resourceType: 'app',
        resourceId: id,
        metadata: {
          sessionId: currentSessionId,
          durationMs: Date.now() - startTime,
        },
        success: true,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        data: {
          result: result.result,
          sessionId: currentSessionId,
          executionLog: result.executionLog,
        },
      };
    } catch (error) {
      await this.auditService.log({
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        action: 'api.app.execute',
        resourceType: 'app',
        resourceId: id,
        metadata: { error: (error as Error).message },
        success: false,
        errorMessage: (error as Error).message,
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
