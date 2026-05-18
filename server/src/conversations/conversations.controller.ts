import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Request,
  Res,
  Query,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { Request as ExpressRequest, Response } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

type AuthenticatedRequest = ExpressRequest & { user: { id: string } };

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * 创建对话
   * @param req 请求对象
   * @param createConversationDto 创建对话DTO
   * @returns 创建后的对话
   */
  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.create(req.user.id, createConversationDto);
  }

  /**
   * 获取所有对话（分页）
   * @param req 请求对象
   * @param paginationQuery 分页参数
   * @returns 分页对话列表
   */
  @Get()
  findAllPaginated(
    @Request() req: AuthenticatedRequest,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.conversationsService.findAllPaginated(
      req.user.id,
      paginationQuery,
    );
  }

  /**
   * 获取对话详情
   * @param req 请求对象
   * @param id 对话ID
   * @returns 对话详情
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.conversationsService.findOne(id, req.user.id);
  }

  /**
   * 获取对话消息（分页）
   * @param id 对话ID
   * @param req 请求对象
   * @param paginationQuery 分页参数
   * @returns 分页消息
   */
  @Get(':id/messages')
  findMessagesPaginated(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.conversationsService.findMessagesPaginated(
      id,
      req.user.id,
      paginationQuery,
    );
  }

  /**
   * 重命名对话
   * @param id 对话ID
   * @param req 请求对象
   * @param renameDto 重命名DTO
   * @returns 更新后的对话
   */
  @Patch(':id/rename')
  rename(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() renameDto: RenameConversationDto,
  ) {
    return this.conversationsService.rename(id, req.user.id, renameDto.title);
  }

  /**
   * 切换消息收藏状态
   * @param messageId 消息ID
   * @param req 请求对象
   * @param toggleDto 收藏状态DTO
   * @returns 更新后的消息
   */
  @Patch('messages/:messageId/favorite')
  toggleFavorite(
    @Param('messageId') messageId: string,
    @Request() req: AuthenticatedRequest,
    @Body() toggleDto: ToggleFavoriteDto,
  ) {
    return this.conversationsService.toggleMessageFavorite(
      messageId,
      req.user.id,
      toggleDto.favorite,
    );
  }

  /**
   * 删除对话
   * @param req 请求对象
   * @param id 对话ID
   * @returns 删除后的对话
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.conversationsService.remove(id, req.user.id);
  }

  /**
   * 发送消息到对话
   * @param req 请求对象
   * @param id 对话ID
   * @param sendMessageDto 发送消息DTO
   * @returns 发送消息后的结果
   */
  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(
      id,
      req.user.id,
      sendMessageDto,
    );
  }

  /**
   * 发送消息到对话（流式）
   * @param req 请求对象
   * @param id 对话ID
   * @param sendMessageDto 发送消息DTO
   * @returns 流式消息流
   */
  @Post(':id/messages-stream')
  async sendMessageStream(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() sendMessageDto: SendMessageDto,
    @Res() res: Response,
  ) {
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = await this.conversationsService.sendMessageStream(
      id,
      req.user.id,
      sendMessageDto,
    );

    stream.pipe(res);

    res.on('close', () => {
      stream.destroy();
    });
  }

  /**
   * 更新对话（保持向后兼容）
   * @param req 请求对象
   * @param id 对话ID
   * @param updateData 更新数据
   * @returns 更新后的对话
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateData: { title?: string },
  ) {
    return this.conversationsService.update(id, req.user.id, updateData);
  }

  @Patch('messages/:messageId/rate')
  rateMessage(
    @Param('messageId') messageId: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { rating: number; feedback?: string },
  ) {
    return this.conversationsService.rateMessage(
      messageId,
      req.user.id,
      body.rating,
      body.feedback,
    );
  }

  @Get('stats')
  getConversationStats(
    @Request() req: AuthenticatedRequest,
    @Query('appId') appId?: string,
  ) {
    return this.conversationsService.getConversationStats(req.user.id, appId);
  }

  @Get('stats/app/:appId')
  getAppConversationStats(
    @Param('appId') appId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.conversationsService.getAppConversationStats(
      appId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats/ratings')
  getRatingStats(
    @Request() req: AuthenticatedRequest,
    @Query('appId') appId?: string,
  ) {
    return this.conversationsService.getMessageRatingStats(req.user.id, appId);
  }

  @Get('stats/latency')
  getLatencyStats(
    @Request() req: AuthenticatedRequest,
    @Query('appId') appId?: string,
  ) {
    return this.conversationsService.getLatencyStats(req.user.id, appId);
  }

  @Get('stats/relevance')
  getRelevanceStats(
    @Request() req: AuthenticatedRequest,
    @Query('appId') appId?: string,
  ) {
    return this.conversationsService.getRelevanceStats(req.user.id, appId);
  }

  @Get('stats/daily')
  getDailyConversationStats(
    @Request() req: AuthenticatedRequest,
    @Query('days') days: string = '30',
  ) {
    return this.conversationsService.getDailyConversationStats(
      req.user.id,
      parseInt(days, 10),
    );
  }

  @Get('stats/summary')
  getApplicationEffectSummary(@Request() req: AuthenticatedRequest) {
    return this.conversationsService.getApplicationEffectSummary(req.user.id);
  }
}
