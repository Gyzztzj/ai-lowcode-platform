import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { AppsService } from '../apps/apps.service';

@Injectable()
export class OpenApiService {
  constructor(
    @Inject(forwardRef(() => AppsService))
    private readonly appsService: AppsService,
  ) {}

  /** 共享的 API Key 安全方案定义 */
  private readonly apiKeySecurityScheme = {
    ApiKeyAuth: {
      type: 'apiKey' as const,
      in: 'header' as const,
      name: 'X-API-Key',
      description: 'API key for authentication',
    },
  };

  /** 通用的执行请求 schema */
  private readonly executeRequestBody = {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Input text for the application',
            },
            sessionId: {
              type: 'string',
              nullable: true,
              description: 'Optional session ID for stateful execution',
            },
            variables: {
              type: 'object',
              nullable: true,
              description: 'Optional variables to pass to the workflow',
            },
          },
          required: ['input'],
        },
      },
    },
  };

  /** 通用的执行响应 schema */
  private readonly executeResponses = {
    '200': {
      description: 'Execution successful',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  result: { type: 'string' },
                  sessionId: { type: 'string' },
                  executionLog: {
                    type: 'array',
                    items: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '400': { description: 'Bad request' },
    '401': { description: 'Unauthorized - Invalid API key' },
    '403': { description: 'Forbidden - Insufficient quota' },
  };

  private createExecutePathItem(appName: string, appDescription?: string) {
    return {
      post: {
        summary: `Execute ${appName}`,
        description: appDescription || `Execute the ${appName} workflow`,
        operationId: `executeApp_${appName.replace(/\s+/g, '_')}`,
        tags: ['Apps'],
        requestBody: this.executeRequestBody,
        responses: this.executeResponses,
      },
    };
  }

  private buildBaseSpec(info: { title: string; description: string }) {
    return {
      openapi: '3.0.3',
      info: { ...info, version: '1.0.0' },
      servers: [{ url: '/', description: 'Current server' }],
      security: [{ ApiKeyAuth: [] }],
      components: {
        securitySchemes: this.apiKeySecurityScheme,
      },
    };
  }

  async generateOpenApiSpec(apiKeyUserId: string): Promise<object> {
    const apps = await this.appsService.findAll(apiKeyUserId);

    const paths: Record<string, any> = {};
    apps.forEach((app) => {
      paths[`/api/v1/apps/${app.id}/execute`] = this.createExecutePathItem(
        app.name,
        app.description || undefined,
      );
    });

    return {
      ...this.buildBaseSpec({
        title: 'AI Lowcode Platform API',
        description: 'API for executing AI applications',
      }),
      paths,
    };
  }

  async generateAppOpenApiSpec(appId: string, userId: string): Promise<object> {
    const app = await this.appsService.findOne(appId, userId);
    if (!app) {
      throw new Error('App not found');
    }

    return {
      ...this.buildBaseSpec({
        title: `${app.name} API`,
        description: app.description || `${app.name} application API`,
      }),
      paths: {
        [`/api/v1/apps/${app.id}/execute`]: this.createExecutePathItem(
          app.name,
          app.description || undefined,
        ),
      },
    };
  }
}
