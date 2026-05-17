import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotaService } from './quota.service';
import { QuotaController } from './quota.controller';
import { QuotaInterceptor } from './quota.interceptor';
import { User } from '../entities/user.entity';
import { App } from '../entities/app.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, App]), RedisModule],
  controllers: [QuotaController],
  providers: [QuotaService, QuotaInterceptor],
  exports: [QuotaService, QuotaInterceptor],
})
export class QuotaModule {}
