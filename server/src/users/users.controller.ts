import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  RequirePermissions,
  Permission,
} from '../decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get()
  @RequirePermissions(Permission.READ_USERS)
  async findAll() {
    return this.userRepository.find({
      select: ['id', 'email', 'name', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }
}
