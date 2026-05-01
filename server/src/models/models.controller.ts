import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../decorators/permissions.decorator';

@Controller('models')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  @RequirePermissions(Permission.WRITE_MODELS)
  create(@Body() createModelDto: CreateModelDto) {
    return this.modelsService.create(createModelDto);
  }

  @Get()
  @RequirePermissions(Permission.READ_MODELS)
  findAll() {
    return this.modelsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.READ_MODELS)
  findOne(@Param('id') id: string) {
    return this.modelsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.WRITE_MODELS)
  update(@Param('id') id: string, @Body() updateModelDto: UpdateModelDto) {
    return this.modelsService.update(id, updateModelDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_MODELS)
  remove(@Param('id') id: string) {
    return this.modelsService.remove(id);
  }
}
