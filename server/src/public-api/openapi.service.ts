import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { AppsService } from '../apps/apps.service';

@Injectable()
export class OpenApiService {
  constructor(
    @Inject(forwardRef(() => AppsService))
    private readonly appsService: AppsService,
  ) {}

  private createExecuteSchema(appName: string, appDescription?: string) {
    return {
      post: {
        summary: `Execute ${appName}`,
        description: appDescription || `Execute the ${appName} workflow`,
        operationId: `executeApp_${appName.replace(/\s+/g, '_')}`,
        tags: ['Apps'],
        requestBody: {
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
        },
        responses: {
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
        },
      },
    };
  }

  async generateOpenApiSpec(apiKeyUserId: string): Promise<object> {
    const apps = await this.appsService.findAll(apiKeyUserId);

    const paths: Record<string, any> = {};
    apps.forEach((app) => {
      paths[`/api/v1/apps/${app.id}/execute`] = this.createExecuteSchema(
        app.name,
        app.description || undefined,
      );
    });

    return {
      openapi: '3.0.3',
      info: {
        title: 'AI Lowcode Platform API',
        description: 'API for executing AI applications',
        version: '1.0.0',
      },
      servers: [{ url: '/', description: 'Current server' }],
      security: [{ ApiKeyAuth: [] }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for authentication',
          },
        },
      },
      paths,
    };
  }

  async generateAppOpenApiSpec(appId: string, userId: string): Promise<object> {
    const app = await this.appsService.findOne(appId, userId);
    if (!app) {
      throw new Error('App not found');
    }

    return {
      openapi: '3.0.3',
      info: {
        title: `${app.name} API`,
        description: app.description || `${app.name} application API`,
        version: '1.0.0',
      },
      servers: [{ url: '/', description: 'Current server' }],
      security: [{ ApiKeyAuth: [] }],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for authentication',
          },
        },
      },
      paths: {
        [`/api/v1/apps/${app.id}/execute`]: this.createExecuteSchema(
          app.name,
          app.description || undefined,
        ),
      },
    };
  }
}
