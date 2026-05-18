import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { AppsService } from '../apps/apps.service';

@Injectable()
export class OpenApiService {
  constructor(
    @Inject(forwardRef(() => AppsService))
    private readonly appsService: AppsService,
  ) {}

  async generateOpenApiSpec(apiKeyUserId: string): Promise<object> {
    const apps = await this.appsService.findAll(apiKeyUserId);

    const paths: Record<string, any> = {
      '/api/v1/apps': {
        get: {
          summary: 'List all apps',
          description:
            'Get a list of all applications accessible by the API key',
          operationId: 'listApps',
          tags: ['Apps'],
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/apps/{id}': {
        get: {
          summary: 'Get app information',
          description: 'Get detailed information about a specific application',
          operationId: 'getApp',
          tags: ['Apps'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Application ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          description: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'App not found',
            },
          },
        },
      },
      '/api/v1/workflows/execute': {
        post: {
          summary: 'Execute workflow',
          description: 'Execute a workflow for a specific application',
          operationId: 'executeWorkflow',
          tags: ['Workflows'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    appId: {
                      type: 'string',
                      description: 'Application ID to execute',
                    },
                    input: {
                      type: 'string',
                      description: 'Input text for the workflow',
                    },
                    sessionId: {
                      type: 'string',
                      nullable: true,
                      description: 'Optional session ID for stateful workflows',
                    },
                    variables: {
                      type: 'object',
                      nullable: true,
                      description: 'Optional variables to pass to the workflow',
                    },
                  },
                  required: ['appId', 'input'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Workflow executed successfully',
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
            '400': {
              description:
                'Bad request - App not found or workflow not configured',
            },
          },
        },
      },
      '/api/v1/sessions': {
        get: {
          summary: 'List user sessions',
          description: 'Get a list of active sessions for the user',
          operationId: 'listSessions',
          tags: ['Sessions'],
          parameters: [
            {
              name: 'appId',
              in: 'query',
              required: false,
              description: 'Filter sessions by application ID',
              schema: { type: 'string' },
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              description: 'Maximum number of sessions to return',
              schema: { type: 'string', default: '50' },
            },
          ],
          responses: {
            '200': {
              description: 'Successful operation',
            },
          },
        },
      },
      '/api/v1/sessions/{sessionId}': {
        get: {
          summary: 'Get session state',
          description: 'Get the current state of a specific session',
          operationId: 'getSession',
          tags: ['Sessions'],
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              description: 'Session ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Successful operation',
            },
            '404': {
              description: 'Session not found',
            },
          },
        },
        patch: {
          summary: 'Set session variable',
          description: 'Set or update a variable in a session',
          operationId: 'setSessionVariable',
          tags: ['Sessions'],
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              description: 'Session ID',
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Variable name' },
                    value: { type: 'object', description: 'Variable value' },
                  },
                  required: ['key', 'value'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Variable set successfully',
            },
          },
        },
        delete: {
          summary: 'Delete session',
          description: 'Delete a session and release associated resources',
          operationId: 'deleteSession',
          tags: ['Sessions'],
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              description: 'Session ID',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Session deleted successfully',
            },
          },
        },
      },
      '/api/v1/usage/tokens': {
        get: {
          summary: 'Get token usage statistics',
          description: 'Get token usage statistics for the API key',
          operationId: 'getTokenUsage',
          tags: ['Usage'],
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              required: false,
              description: 'Start date for the statistics period',
              schema: { type: 'string', format: 'date' },
            },
            {
              name: 'endDate',
              in: 'query',
              required: false,
              description: 'End date for the statistics period',
              schema: { type: 'string', format: 'date' },
            },
          ],
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          totalTokens: { type: 'number' },
                          promptTokens: { type: 'number' },
                          completionTokens: { type: 'number' },
                          records: { type: 'number' },
                          usage: { type: 'array', items: { type: 'object' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/audit/logs': {
        get: {
          summary: 'Get audit logs',
          description: 'Get audit logs for the API key',
          operationId: 'getAuditLogs',
          tags: ['Audit'],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              required: false,
              description: 'Maximum number of logs to return',
              schema: { type: 'string', default: '100' },
            },
          ],
          responses: {
            '200': {
              description: 'Successful operation',
            },
          },
        },
      },
    };

    const appPaths: Record<string, any> = {};
    apps.forEach((app) => {
      const appPath = `/api/v1/apps/${app.id}/execute`;
      appPaths[appPath] = {
        post: {
          summary: `Execute ${app.name}`,
          description: app.description || `Execute the ${app.name} workflow`,
          operationId: `executeApp_${app.id}`,
          tags: ['Apps', app.name],
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
          },
        },
      };
    });

    return {
      openapi: '3.0.3',
      info: {
        title: 'AI Lowcode Platform Public API',
        description: 'API documentation for AI Lowcode Platform applications',
        version: '1.0.0',
      },
      servers: [
        {
          url: '/',
          description: 'Current server',
        },
      ],
      security: [
        {
          ApiKeyAuth: [],
        },
      ],
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
      paths: { ...paths, ...appPaths },
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
        description:
          app.description || `${app.name} application API documentation`,
        version: '1.0.0',
      },
      servers: [
        {
          url: '/',
          description: 'Current server',
        },
      ],
      security: [
        {
          ApiKeyAuth: [],
        },
      ],
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
        [`/api/v1/apps/${app.id}/execute`]: {
          post: {
            summary: `Execute ${app.name}`,
            description: app.description || `Execute the ${app.name} workflow`,
            operationId: `executeApp_${app.id}`,
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
                        description:
                          'Optional session ID for stateful execution',
                      },
                      variables: {
                        type: 'object',
                        nullable: true,
                        description:
                          'Optional variables to pass to the workflow',
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
              '400': {
                description: 'Bad request',
              },
              '401': {
                description: 'Unauthorized - Invalid API key',
              },
              '403': {
                description: 'Forbidden - Insufficient quota',
              },
            },
          },
        },
      },
    };
  }
}
