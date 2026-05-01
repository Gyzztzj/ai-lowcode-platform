import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowSession } from '../entities/workflow-session.entity';
import { ContextManagerService } from './context-manager.service';
import { TemplateEngine } from '../utils/template-engine.util';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowSession])],
  providers: [ContextManagerService, TemplateEngine],
  exports: [ContextManagerService, TemplateEngine],
})
export class ContextModule {}
