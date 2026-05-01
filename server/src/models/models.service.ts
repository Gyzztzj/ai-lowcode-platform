import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { Model } from '../entities';

@Injectable()
export class ModelsService {
  private readonly logger = new Logger(ModelsService.name);

  constructor(
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
  ) {}

  async create(createModelDto: CreateModelDto) {
    try {
      // 用户创建的模型不能设置为系统模型
      if (createModelDto.isSystem) {
        throw new ForbiddenException('不能创建系统模型');
      }

      this.logger.log('创建新模型:', JSON.stringify(createModelDto, null, 2));
      const newModel = this.modelRepository.create(createModelDto);
      const savedModel = await this.modelRepository.save(newModel);
      this.logger.log('模型创建成功:', savedModel.id);
      return savedModel;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        '创建模型失败:',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('创建模型失败');
    }
  }

  async findAll() {
    try {
      this.logger.log('查询所有模型');
      const models = await this.modelRepository.find({
        order: {
          isSystem: 'DESC',
          updatedAt: 'DESC',
        },
      });
      this.logger.log(`找到 ${models.length} 个模型`);
      return models;
    } catch (error) {
      this.logger.error(
        '查询模型列表失败:',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('查询模型列表失败');
    }
  }

  async findOne(id: string) {
    try {
      this.logger.log(`查询模型 ID: ${id}`);
      const model = await this.modelRepository.findOne({
        where: { id },
      });

      if (!model) {
        throw new NotFoundException('模型不存在');
      }

      return model;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `查询模型 ${id} 失败:`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('查询模型失败');
    }
  }

  async update(id: string, updateModelDto: UpdateModelDto) {
    try {
      const model = await this.findOne(id);

      // 系统模型不能修改 isSystem 属性
      if (model.isSystem && updateModelDto.isSystem !== undefined) {
        throw new ForbiddenException('不能修改系统模型的系统属性');
      }

      this.logger.log(
        `更新模型 ID: ${id}`,
        JSON.stringify(updateModelDto, null, 2),
      );
      await this.modelRepository.update(id, updateModelDto);
      const updatedModel = await this.findOne(id);
      this.logger.log(`模型 ${id} 更新成功`);
      return updatedModel;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `更新模型 ${id} 失败:`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('更新模型失败');
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`删除模型 ID: ${id}`);
      const model = await this.findOne(id);

      // 系统模型不能删除
      if (model.isSystem) {
        throw new ForbiddenException('不能删除系统模型');
      }

      await this.modelRepository.softDelete(id);
      this.logger.log(`模型 ${id} 删除成功`);
      return model;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `删除模型 ${id} 失败:`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('删除模型失败');
    }
  }
}
