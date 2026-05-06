import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { JsonExceptionFilter } from './filters/json-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as bodyParser from 'body-parser';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 根路径重定向到 Swagger 文档
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (req, res) => {
    res.redirect('/api/docs');
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 安全的CORS配置
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin:
      allowedOrigins.length > 0
        ? (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        : process.env.NODE_ENV === 'development'
          ? true
          : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  //全局验证管道，用于验证dto
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //自动过滤掉dto中不存在的属性
      forbidNonWhitelisted: true, //如果dto中不存在的属性，会抛出异常
      transform: true, //自动将请求体转换为dto
    }),
  );

  // 全局响应拦截器，统一API响应格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器，确保所有响应都是JSON格式
  app.useGlobalFilters(new JsonExceptionFilter());

  // 增加文件上传大小限制（最大100MB）
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('AI Lowcode Platform API')
    .setDescription(
      'API documentation for AI Lowcode Platform - 完整的AI低代码平台API，包括用户认证、AI对话、工作流、知识库、API开放平台等功能',
    )
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Enter your API key for OpenAI compatible API',
      },
      'API-Key-auth',
    )
    .addTag('Auth', '用户认证相关接口')
    .addTag('Apps', '应用管理与工作流相关接口')
    .addTag('Conversations', '对话管理相关接口')
    .addTag('AI', 'AI能力相关接口')
    .addTag('Knowledge', '知识库管理相关接口')
    .addTag('API-Keys', 'API密钥管理相关接口')
    .addTag('Token-Usage', 'Token用量统计相关接口')
    .addTag('OpenAI', 'OpenAI兼容API接口')
    .addTag('Audit', '审计日志相关接口')
    .addTag('System-Config', '系统配置相关接口')
    .addTag('Recycle-Bin', '回收站相关接口')
    .addTag('API-Call-Logs', 'API调用日志相关接口')
    .addTag('Public API', 'Public API endpoints for external integrations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'AI Lowcode Platform API Docs',
  });

  // 启动应用
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const url = await app.getUrl();
  logger.log(`服务端已启动: ${url}`);
  logger.log(`API 文档: ${url}/api/docs`);
}

bootstrap().catch((error) => {
  logger.error('应用启动失败', error.stack);
  process.exit(1);
});
