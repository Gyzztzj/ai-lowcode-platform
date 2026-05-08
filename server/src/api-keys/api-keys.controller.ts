/**
 * API密钥控制器（用于管理API密钥）
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RefreshApiKeyDto } from './dto/refresh-api-key.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateApiKeyDto) {
    const result = await this.apiKeysService.create(req.user.id, dto);
    return {
      id: result.apiKey.id,
      name: result.apiKey.name,
      key: result.key,
      status: result.apiKey.status,
      permissions: result.apiKey.permissions,
      expiresAt: result.apiKey.expiresAt,
      createdAt: result.apiKey.createdAt,
      appId: result.apiKey.appId,
    };
  }

  @Get()
  async findAll(@Request() req) {
    const keys = await this.apiKeysService.findAll(req.user.id);
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      status: key.status,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      requestCount: key.requestCount,
      createdAt: key.createdAt,
      appId: key.appId,
      app: key.app,
    }));
  }

  @Get('apps/:appId')
  async findByApp(@Request() req, @Param('appId') appId: string) {
    const keys = await this.apiKeysService.findByApp(appId, req.user.id);
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      status: key.status,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      requestCount: key.requestCount,
      createdAt: key.createdAt,
      appId: key.appId,
      app: key.app,
    }));
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const key = await this.apiKeysService.findOne(id, req.user.id);
    return {
      id: key.id,
      name: key.name,
      status: key.status,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      requestCount: key.requestCount,
      createdAt: key.createdAt,
      appId: key.appId,
      app: key.app,
    };
  }

  @Post(':id/refresh')
  async refresh(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RefreshApiKeyDto,
  ) {
    const result = await this.apiKeysService.refresh(id, req.user.id, dto);
    return {
      id: result.apiKey.id,
      name: result.apiKey.name,
      key: result.key,
      status: result.apiKey.status,
      permissions: result.apiKey.permissions,
      expiresAt: result.apiKey.expiresAt,
      createdAt: result.apiKey.createdAt,
    };
  }

  @Post(':id/revoke')
  async revoke(@Request() req, @Param('id') id: string) {
    const key = await this.apiKeysService.revoke(id, req.user.id);
    return {
      id: key.id,
      name: key.name,
      status: key.status,
    };
  }

  @Post(':id/activate')
  async activate(@Request() req, @Param('id') id: string) {
    const key = await this.apiKeysService.activate(id, req.user.id);
    return {
      id: key.id,
      name: key.name,
      status: key.status,
    };
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.apiKeysService.delete(id, req.user.id);
    return { success: true };
  }
}
