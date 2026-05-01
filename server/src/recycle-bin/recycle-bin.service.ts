import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, Not } from 'typeorm';
import { App, KnowledgeBase, Conversation } from '../entities';

@Injectable()
export class RecycleBinService {
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(KnowledgeBase)
    private knowledgeBaseRepository: Repository<KnowledgeBase>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async findDeleted(userId: string, type?: string) {
    const result: {
      apps?: App[];
      knowledgeBases?: KnowledgeBase[];
      conversations?: Conversation[];
    } = {};

    if (!type || type === 'app') {
      result.apps = await this.appRepository.find({
        where: { userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
        order: { deletedAt: 'DESC' },
      });
    }

    if (!type || type === 'knowledge') {
      result.knowledgeBases = await this.knowledgeBaseRepository.find({
        where: { userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
        order: { deletedAt: 'DESC' },
      });
    }

    if (!type || type === 'conversation') {
      result.conversations = await this.conversationRepository.find({
        where: { userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
        order: { deletedAt: 'DESC' },
      });
    }

    return result;
  }

  async restore(
    userId: string,
    type: string,
    id: string,
  ): Promise<App | KnowledgeBase | Conversation> {
    let result: App | KnowledgeBase | Conversation | null;

    if (type === 'app') {
      result = await this.appRepository.findOne({
        where: { id, userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });
      if (result) {
        await this.appRepository.restore(id);
      }
    } else if (type === 'knowledge') {
      result = await this.knowledgeBaseRepository.findOne({
        where: { id, userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });
      if (result) {
        await this.knowledgeBaseRepository.restore(id);
      }
    } else if (type === 'conversation') {
      result = await this.conversationRepository.findOne({
        where: { id, userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });
      if (result) {
        await this.conversationRepository.restore(id);
      }
    } else {
      throw new NotFoundException('无效的资源类型');
    }

    if (!result) {
      throw new NotFoundException('资源不存在或无权访问');
    }

    return result;
  }

  async permanentDelete(userId: string, type: string, id: string) {
    let entity: App | KnowledgeBase | Conversation | null;

    if (type === 'app') {
      entity = await this.appRepository.findOne({
        where: { id, userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });
      if (entity) {
        await this.appRepository.remove(entity);
      }
    } else if (type === 'knowledge') {
      entity = await this.knowledgeBaseRepository.findOne({
        where: { id, userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });
      if (entity) {
        await this.knowledgeBaseRepository.remove(entity);
      }
    } else if (type === 'conversation') {
      entity = await this.conversationRepository.findOne({
        where: { id, userId, deletedAt: Not(IsNull()) },
        withDeleted: true,
      });
      if (entity) {
        await this.conversationRepository.remove(entity);
      }
    } else {
      throw new NotFoundException('无效的资源类型');
    }

    if (!entity) {
      throw new NotFoundException('资源不存在或无权访问');
    }

    return entity;
  }

  async cleanExpired(expiredDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - expiredDays);

    const deleteCondition = { deletedAt: LessThan(cutoffDate) };

    await this.appRepository.delete(deleteCondition);
    await this.knowledgeBaseRepository.delete(deleteCondition);
    await this.conversationRepository.delete(deleteCondition);
  }
}
