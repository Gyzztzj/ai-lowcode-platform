/**
 * 对话服务
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Readable } from 'stream';
import { MessageRole } from '../entities';
import { FlowService } from '../flow/flow.service';
import { FlowEdge, FlowNode } from '../flow/flow.types';
import { Conversation, Message, App } from '../entities';
import {
  PaginationQueryDto,
  PaginationResultDto,
} from '../common/dto/pagination.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private aiService: AiService,
    private flowService: FlowService,
  ) {}

  /**
   * 创建对话
   * @param userId 用户ID
   * @param createConversationDto 创建对话DTO
   * @returns 创建的对话
   */
  async create(userId: string, createConversationDto: CreateConversationDto) {
    const { appId, title } = createConversationDto;

    // 验证应用是否存在且用户有权限
    const app = await this.appRepository.findOne({
      where: { id: appId },
    });

    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    if (app.userId !== userId && !app.isPublic) {
      throw new ForbiddenException('你没有权限使用此应用');
    }

    const newConversation = this.conversationRepository.create({
      appId,
      userId,
      title: title || '新对话',
    });
    return this.conversationRepository.save(newConversation);
  }

  /**
   * 获取所有对话（分页）
   * @param userId 用户ID
   * @param paginationQuery 分页参数
   * @returns 分页结果
   */
  async findAllPaginated(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResultDto<Conversation>> {
    const { page, pageSize } = paginationQuery;
    const [data, total] = await this.conversationRepository.findAndCount({
      where: { userId },
      relations: {
        app: true,
      },
      order: {
        updatedAt: 'DESC',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new PaginationResultDto(data, total, page, pageSize);
  }

  /**
   * 获取所有对话（不分页，保持兼容）
   * @param userId 用户ID
   * @returns 所有对话
   */
  async findAll(userId: string) {
    return this.conversationRepository.find({
      where: { userId },
      relations: {
        app: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * 获取对话详情
   * @param id 对话ID
   * @param userId 用户ID
   * @returns 对话详情
   */
  async findOne(id: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: {
        messages: true,
        app: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('你没有权限访问此对话');
    }

    // 确保消息按创建时间排序
    if (conversation.messages) {
      conversation.messages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    return conversation;
  }

  /**
   * 获取对话消息（分页）
   * @param id 对话ID
   * @param userId 用户ID
   * @param paginationQuery 分页参数
   * @returns 分页消息
   */
  async findMessagesPaginated(
    id: string,
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginationResultDto<Message>> {
    // 先验证对话权限
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException('对话不存在或无权访问');
    }

    const { page, pageSize } = paginationQuery;
    const [data, total] = await this.messageRepository.findAndCount({
      where: { conversationId: id },
      order: {
        createdAt: 'ASC',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new PaginationResultDto(data, total, page, pageSize);
  }

  /**
   * 删除对话
   * @param id 对话ID
   * @param userId 用户ID
   * @returns 删除后的对话
   */
  async remove(id: string, userId: string) {
    const conversation = await this.findOne(id, userId);

    if (conversation.userId !== userId) {
      throw new ForbiddenException('你没有权限删除此对话');
    }

    await this.conversationRepository.softDelete(id);
    return conversation;
  }

  /**
   * 重命名对话
   * @param id 对话ID
   * @param userId 用户ID
   * @param title 新标题
   * @returns 更新后的对话
   */
  async rename(id: string, userId: string, title: string) {
    const conversation = await this.findOne(id, userId);

    if (conversation.userId !== userId) {
      throw new ForbiddenException('你没有权限更新此对话');
    }

    await this.conversationRepository.update(id, { title });
    return this.findOne(id, userId);
  }

  /**
   * 切换消息收藏状态
   * @param messageId 消息ID
   * @param userId 用户ID
   * @param favorite 收藏状态（可选，不传则切换）
   * @returns 更新后的消息
   */
  async toggleMessageFavorite(
    messageId: string,
    userId: string,
    favorite?: boolean,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        conversation: true,
      },
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    // 验证对话所有权
    if (message.conversation.userId !== userId) {
      throw new ForbiddenException('你没有权限操作此消息');
    }

    // 如果未指定favorite，则切换当前状态
    const newFavorite = favorite !== undefined ? favorite : !message.favorite;

    await this.messageRepository.update(messageId, { favorite: newFavorite });

    // 返回更新后的消息
    return this.messageRepository.findOne({ where: { id: messageId } });
  }

  /**
   * 发送消息到对话
   * @param id 对话ID
   * @param userId 用户ID
   * @param sendMessageDto 发送消息DTO
   * @returns 发送消息后的结果
   */
  async sendMessage(
    id: string,
    userId: string,
    sendMessageDto: SendMessageDto,
  ) {
    const { content } = sendMessageDto;
    const conversation = await this.prepareConversationForMessage(
      id,
      userId,
      content,
    );
    const app = conversation.app;

    let aiResponse: { content: string; usage?: unknown };
    // 如果应用有流程数据，使用流程执行引擎
    if (app.nodes && app.edges) {
      const historyMessages = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      const result = await this.flowService.executeFlow(
        app.nodes,
        app.edges,
        content,
        app.id,
        userId,
        { historyMessages },
      );
      aiResponse = { content: result.result };
    } else {
      const messages = this.buildMessages(
        app.systemPrompt,
        conversation,
        content,
      );
      aiResponse = (await this.aiService.chat({
        messages,
        model: app.defaultModel,
        stream: false,
      })) as { content: string; usage?: unknown };
    }
    const assistantMessage = await this.saveAssistantMessage(
      id,
      aiResponse.content,
    );
    await this.touchConversation(id);

    return {
      message: assistantMessage,
      usage: aiResponse.usage,
    };
  }

  /**
   * 发送消息到对话（流式）
   * @param id 对话ID
   * @param userId 用户ID
   * @param sendMessageDto 发送消息DTO
   * @returns 流式消息流
   */
  async sendMessageStream(
    id: string,
    userId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<Readable> {
    const { content } = sendMessageDto;
    const conversation = await this.prepareConversationForMessage(
      id,
      userId,
      content,
    );
    const app = conversation.app;

    const transformStream = new Readable({
      read() {},
    });

    let fullContent = '';

    // 如果应用有流程数据，使用流程执行引擎（非流式执行但流式返回）
    if (app.nodes && app.edges) {
      const historyMessages = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      try {
        const result = await this.flowService.executeFlow(
          app.nodes,
          app.edges,
          content,
          app.id,
          userId,
          { historyMessages },
        );

        fullContent = result.result;

        // 模拟流式返回，逐字符发送
        for (let i = 0; i < fullContent.length; i++) {
          const char = fullContent[i];
          transformStream.push(
            `data: ${JSON.stringify({ content: char })}\n\n`,
          );
          // 添加小延迟让它看起来像流式
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } catch (error) {
        fullContent = '抱歉，执行出错了，请稍后重试。';
        transformStream.push(
          `data: ${JSON.stringify({ content: fullContent })}\n\n`,
        );
      }

      await this.saveAssistantMessage(id, fullContent);
      await this.touchConversation(id);

      transformStream.push(`data: [DONE]\n\n`);
      transformStream.push(null);
    } else {
      const messages = this.buildMessages(
        app.systemPrompt,
        conversation,
        content,
      );

      // 调用AI流式服务
      const stream = await this.aiService.streamChat({
        messages,
        model: app.defaultModel,
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          transformStream.push(chunk);

          const dataStr = chunk.toString();
          const lines = dataStr.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6);
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data) as { content?: string };
                  if (parsed.content) {
                    fullContent += parsed.content;
                  }
                } catch {
                  // 忽略解析失败的非标准片段，继续消费流
                }
              }
            }
          }
        });

        stream.on('end', async () => {
          try {
            await this.saveAssistantMessage(id, fullContent);
            await this.touchConversation(id);
          } catch (error) {}
          transformStream.push(null);
          resolve();
        });

        stream.on('error', (error) => {
          transformStream.push(null);
          reject(error);
        });
      });
    }

    return transformStream;
  }

  /**
   * 准备对话
   * @param conversationId 对话ID
   * @param userId 用户ID
   * @param content 消息内容
   * @returns 对话
   */
  private async prepareConversationForMessage(
    conversationId: string,
    userId: string,
    content: string,
  ): Promise<Awaited<ReturnType<ConversationsService['findOne']>>> {
    const conversation = await this.findOne(conversationId, userId);
    const newMessage = this.messageRepository.create({
      conversationId,
      role: MessageRole.user,
      content,
    });
    await this.messageRepository.save(newMessage);
    return conversation;
  }

  /**
   * 构建消息
   * @param systemPrompt 系统提示词
   * @param conversation 对话
   * @param content 消息内容
   * @returns 消息列表
   */
  private buildMessages(
    systemPrompt: string,
    conversation: Awaited<ReturnType<ConversationsService['findOne']>>,
    content: string,
  ) {
    return [
      {
        role: MessageRole.system,
        content: systemPrompt,
      },
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: MessageRole.user,
        content,
      },
    ];
  }

  /**
   * 保存AI回复消息
   * @param conversationId 对话ID
   * @param content 消息内容
   * @returns 保存后的消息
   */
  private async saveAssistantMessage(conversationId: string, content: string) {
    const newMessage = this.messageRepository.create({
      conversationId,
      role: MessageRole.assistant,
      content,
    });
    return this.messageRepository.save(newMessage);
  }

  /**
   * 更新对话
   * @param id 对话ID
   * @param userId 用户ID
   * @param updateData 更新数据
   * @returns 更新后的对话
   */
  async update(id: string, userId: string, updateData: { title?: string }) {
    const conversation = await this.findOne(id, userId);

    if (conversation.userId !== userId) {
      throw new ForbiddenException('你没有权限更新此对话');
    }

    await this.conversationRepository.update(id, updateData);
    return this.findOne(id, userId);
  }

  /**
   * 更新对话的更新时间
   * @param conversationId 对话ID
   * @returns 更新后的对话
   */
  private async touchConversation(conversationId: string) {
    await this.conversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });
  }

  async rateMessage(
    messageId: string,
    userId: string,
    rating: number,
    feedback?: string,
  ) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: { conversation: true },
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    if (message.conversation.userId !== userId) {
      throw new ForbiddenException('你没有权限操作此消息');
    }

    await this.messageRepository.update(messageId, { rating, feedback });
    return this.messageRepository.findOne({ where: { id: messageId } });
  }

  async getConversationStats(userId: string, appId?: string) {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .select('conversation.appId', 'appId')
      .addSelect('COUNT(DISTINCT conversation.id)', 'conversationCount')
      .addSelect('COUNT(message.id)', 'messageCount')
      .leftJoin('conversation.messages', 'message')
      .where('conversation.userId = :userId', { userId });

    if (appId) {
      queryBuilder.andWhere('conversation.appId = :appId', { appId });
    }

    const result = await queryBuilder
      .groupBy('conversation.appId')
      .getRawMany();

    return result.map((item) => ({
      appId: item.appId,
      conversationCount: Number(item.conversationCount) || 0,
      messageCount: Number(item.messageCount) || 0,
    }));
  }

  async getAppConversationStats(
    appId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .select('DATE(conversation.createdAt)', 'date')
      .addSelect('COUNT(conversation.id)', 'conversationCount')
      .addSelect('COUNT(message.id)', 'messageCount')
      .leftJoin('conversation.messages', 'message')
      .where('conversation.appId = :appId', { appId });

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'conversation.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const result = await queryBuilder
      .groupBy('DATE(conversation.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      date: item.date,
      conversationCount: Number(item.conversationCount) || 0,
      messageCount: Number(item.messageCount) || 0,
    }));
  }

  async getMessageRatingStats(userId: string, appId?: string) {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .select('AVG(message.rating)', 'avgRating')
      .addSelect('COUNT(message.id)', 'ratedCount')
      .addSelect(
        'COUNT(CASE WHEN message.rating >= 4 THEN 1 END)',
        'positiveCount',
      )
      .addSelect(
        'COUNT(CASE WHEN message.rating <= 2 THEN 1 END)',
        'negativeCount',
      )
      .innerJoin('message.conversation', 'conversation')
      .where('conversation.userId = :userId', { userId })
      .andWhere('message.rating IS NOT NULL');

    if (appId) {
      queryBuilder.andWhere('conversation.appId = :appId', { appId });
    }

    const result = await queryBuilder.getRawOne();

    return {
      avgRating: Number(result.avgrating) || 0,
      ratedCount: Number(result.ratedcount) || 0,
      positiveCount: Number(result.positivecount) || 0,
      negativeCount: Number(result.negativecount) || 0,
      positiveRate: result.ratedcount
        ? Number(
            (Number(result.positivecount) / Number(result.ratedcount)) * 100,
          ).toFixed(2)
        : '0',
    };
  }

  async getLatencyStats(userId: string, appId?: string) {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .select('AVG(message.latencyMs)', 'avgLatency')
      .addSelect('MAX(message.latencyMs)', 'maxLatency')
      .addSelect('MIN(message.latencyMs)', 'minLatency')
      .addSelect('COUNT(message.id)', 'count')
      .innerJoin('message.conversation', 'conversation')
      .where('conversation.userId = :userId', { userId })
      .andWhere('message.latencyMs IS NOT NULL')
      .andWhere('message.role = :role', { role: 'assistant' });

    if (appId) {
      queryBuilder.andWhere('conversation.appId = :appId', { appId });
    }

    const result = await queryBuilder.getRawOne();

    return {
      avgLatency: Number(result.avglatency) || 0,
      maxLatency: Number(result.maxlatency) || 0,
      minLatency: Number(result.minlatency) || 0,
      count: Number(result.count) || 0,
    };
  }

  async getRelevanceStats(userId: string, appId?: string) {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .select('AVG(message.relevanceScore)', 'avgRelevance')
      .addSelect('COUNT(message.id)', 'count')
      .innerJoin('message.conversation', 'conversation')
      .where('conversation.userId = :userId', { userId })
      .andWhere('message.relevanceScore IS NOT NULL');

    if (appId) {
      queryBuilder.andWhere('conversation.appId = :appId', { appId });
    }

    const result = await queryBuilder.getRawOne();

    return {
      avgRelevance: Number(result.avgrelevance) || 0,
      count: Number(result.count) || 0,
    };
  }

  async getDailyConversationStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .select('DATE(conversation.createdAt)', 'date')
      .addSelect('COUNT(conversation.id)', 'conversationCount')
      .where('conversation.userId = :userId', { userId })
      .andWhere('conversation.createdAt >= :startDate', { startDate });

    const result = await queryBuilder
      .groupBy('DATE(conversation.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      date: item.date,
      conversationCount: Number(item.conversationCount) || 0,
    }));
  }

  async getApplicationEffectSummary(userId: string) {
    const [conversationStats, ratingStats, latencyStats, relevanceStats] =
      await Promise.all([
        this.getConversationStats(userId),
        this.getMessageRatingStats(userId),
        this.getLatencyStats(userId),
        this.getRelevanceStats(userId),
      ]);

    const totalConversations = conversationStats.reduce(
      (sum, item) => sum + item.conversationCount,
      0,
    );
    const totalMessages = conversationStats.reduce(
      (sum, item) => sum + item.messageCount,
      0,
    );

    return {
      overview: {
        totalConversations,
        totalMessages,
        appCount: conversationStats.length,
      },
      rating: ratingStats,
      latency: latencyStats,
      relevance: relevanceStats,
      apps: conversationStats,
    };
  }
}
