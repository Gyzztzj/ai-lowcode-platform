import { Test, TestingModule } from '@nestjs/testing';
import { OpenApiService } from './openapi.service';
import { AppsService } from '../apps/apps.service';

describe('OpenApiService', () => {
  let service: OpenApiService;

  const mockAppsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenApiService,
        { provide: AppsService, useValue: mockAppsService },
      ],
    }).compile();

    service = module.get<OpenApiService>(OpenApiService);
  });

  describe('generateOpenApiSpec', () => {
    it('should generate OpenAPI spec for all apps', async () => {
      const mockApps = [
        { id: 'app-1', name: 'Test App 1', description: 'First test app' },
        { id: 'app-2', name: 'Test App 2', description: null },
      ];
      mockAppsService.findAll.mockResolvedValue(mockApps);

      const spec = (await service.generateOpenApiSpec('user-1')) as any;

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info.title).toBe('AI Lowcode Platform API');
      expect(spec.paths).toBeDefined();
      expect(spec.paths['/api/v1/apps/app-1/execute']).toBeDefined();
      expect(spec.paths['/api/v1/apps/app-2/execute']).toBeDefined();

      // Verify security scheme is shared (not duplicated)
      expect(spec.components.securitySchemes.ApiKeyAuth).toBeDefined();
      expect(spec.components.securitySchemes.ApiKeyAuth.type).toBe('apiKey');
      expect(spec.components.securitySchemes.ApiKeyAuth.name).toBe('X-API-Key');
      expect(spec.security).toEqual([{ ApiKeyAuth: [] }]);
    });

    it('should handle empty apps list', async () => {
      mockAppsService.findAll.mockResolvedValue([]);

      const spec = (await service.generateOpenApiSpec('user-1')) as any;

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.paths).toEqual({});
    });

    it('should generate valid execute path for each app', async () => {
      const mockApps = [{ id: 'app-1', name: 'My App', description: 'Test' }];
      mockAppsService.findAll.mockResolvedValue(mockApps);

      const spec = (await service.generateOpenApiSpec('user-1')) as any;
      const pathItem = spec.paths['/api/v1/apps/app-1/execute'];

      expect(pathItem.post).toBeDefined();
      expect(pathItem.post.summary).toBe('Execute My App');
      expect(pathItem.post.tags).toEqual(['Apps']);
      expect(pathItem.post.requestBody.required).toBe(true);
      expect(
        pathItem.post.requestBody.content['application/json'].schema.required,
      ).toEqual(['input']);
      expect(pathItem.post.responses['200']).toBeDefined();
      expect(pathItem.post.responses['400']).toBeDefined();
      expect(pathItem.post.responses['401']).toBeDefined();
      expect(pathItem.post.responses['403']).toBeDefined();
    });
  });

  describe('generateAppOpenApiSpec', () => {
    it('should generate spec for single app', async () => {
      mockAppsService.findOne.mockResolvedValue({
        id: 'app-1',
        name: 'Single App',
        description: 'Single test app',
      });

      const spec = (await service.generateAppOpenApiSpec(
        'app-1',
        'user-1',
      )) as any;

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info.title).toBe('Single App API');
      expect(spec.paths['/api/v1/apps/app-1/execute']).toBeDefined();
      expect(spec.components.securitySchemes.ApiKeyAuth).toBeDefined();
    });

    it('should throw error when app not found', async () => {
      mockAppsService.findOne.mockResolvedValue(null);

      await expect(
        service.generateAppOpenApiSpec('non-existent', 'user-1'),
      ).rejects.toThrow('App not found');
    });

    it('should use default description when app has no description', async () => {
      mockAppsService.findOne.mockResolvedValue({
        id: 'app-2',
        name: 'No Desc App',
        description: null,
      });

      const spec = (await service.generateAppOpenApiSpec(
        'app-2',
        'user-1',
      )) as any;

      expect(spec.info.description).toBe('No Desc App application API');
    });
  });
});
