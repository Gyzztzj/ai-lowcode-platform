import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    if (createRoleDto.isSystem) {
      throw new ForbiddenException('不能创建系统角色');
    }

    this.logger.log(`创建角色: ${createRoleDto.name}`);
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll() {
    this.logger.log('查询所有角色');
    return this.roleRepository.find({
      order: {
        isSystem: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    this.logger.log(`查询角色 ID: ${id}`);
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    if (role.isSystem && updateRoleDto.isSystem !== undefined) {
      throw new ForbiddenException('不能修改系统角色的系统属性');
    }

    if (role.isSystem && updateRoleDto.permissions) {
      throw new ForbiddenException('不能修改系统角色的权限');
    }

    this.logger.log(`更新角色 ID: ${id}`);
    await this.roleRepository.update(id, updateRoleDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ForbiddenException('不能删除系统角色');
    }

    this.logger.log(`删除角色 ID: ${id}`);
    await this.roleRepository.delete(id);
    return role;
  }

  async findByName(name: string) {
    return this.roleRepository.findOne({ where: { name } });
  }
}
