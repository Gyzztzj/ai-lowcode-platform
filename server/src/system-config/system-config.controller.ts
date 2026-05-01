import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../decorators/permissions.decorator';
import { SystemConfigService } from './system-config.service';

interface CreateConfigDto {
  key: string;
  value: string;
  description?: string;
  isPublic?: boolean;
}

interface UpdateConfigDto {
  value?: string;
  description?: string;
  isPublic?: boolean;
}

interface RequestWithUser {
  user: { id: string };
}

@ApiTags('system-config')
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('public')
  @ApiOperation({ summary: '获取公开配置' })
  getPublicConfigs() {
    return this.systemConfigService.findPublicConfigs();
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ADMIN)
  @ApiOperation({ summary: '获取所有配置 (需要管理员权限)' })
  findAll() {
    return this.systemConfigService.findAll();
  }

  @Get(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ADMIN)
  @ApiOperation({ summary: '获取指定配置 (需要管理员权限)' })
  findOne(@Param('key') key: string) {
    return this.systemConfigService.findByKey(key);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ADMIN)
  @ApiOperation({ summary: '创建配置 (需要管理员权限)' })
  create(
    @Body() createConfigDto: CreateConfigDto,
    @Request() req: RequestWithUser,
  ) {
    return this.systemConfigService.create({
      ...createConfigDto,
      updatedBy: req.user.id,
    });
  }

  @Put(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ADMIN)
  @ApiOperation({ summary: '更新配置 (需要管理员权限)' })
  update(
    @Param('key') key: string,
    @Body() updateConfigDto: UpdateConfigDto,
    @Request() req: RequestWithUser,
  ) {
    return this.systemConfigService.update(key, {
      ...updateConfigDto,
      updatedBy: req.user.id,
    });
  }

  @Delete(':key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.ADMIN)
  @ApiOperation({ summary: '删除配置 (需要管理员权限)' })
  remove(@Param('key') key: string) {
    return this.systemConfigService.delete(key);
  }
}
