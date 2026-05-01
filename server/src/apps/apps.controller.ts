import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
  UsePipes,
  Res,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { ValidateFlowDto } from './dto/validate-flow.dto';
import { PreviewFlowDto } from './dto/preview-flow.dto';
import { FlowValidationPipe } from './pipes/flow-validation.pipe';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FlowService } from '../flow/flow.service';
import { FlowNode, FlowEdge } from '../flow/flow.types';
import { Readable } from 'stream';

type AuthenticatedRequest = ExpressRequest & { user: { id: string } };

@Controller('apps')
export class AppsController {
  constructor(
    private readonly appsService: AppsService,
    private readonly flowService: FlowService,
  ) {}

  /**
   * 创建应用
   * @param req 请求对象
   * @param createAppDto 创建应用DTO
   * @returns 创建后的应用
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createAppDto: CreateAppDto,
  ) {
    return this.appsService.create(req.user.id, createAppDto);
  }

  /**
   * 获取所有应用
   * @param req 请求对象
   * @returns 所有应用
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.appsService.findAll(req.user.id);
  }

  /**
   * 获取应用详情
   * @param id 应用ID
   * @param req 请求对象
   * @returns 应用详情
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.appsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateAppDto: UpdateAppDto,
  ) {
    return this.appsService.update(id, req.user.id, updateAppDto);
  }

  /**
   * 删除应用
   * @param id 应用ID
   * @param req 请求对象
   * @returns 删除后的应用
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.appsService.remove(id, req.user.id);
  }

  /**
   * 保存应用流程
   * @param id 应用ID
   * @param req 请求对象
   * @param body 流程数据
   * @returns 保存后的应用
   */
  @Patch(':id/flow')
  @UseGuards(JwtAuthGuard)
  @UsePipes(FlowValidationPipe)
  async saveFlow(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: { nodes: FlowNode[]; edges: FlowEdge[] },
  ) {
    return this.appsService.saveFlow(id, req.user.id, body.nodes, body.edges);
  }

  /**
   * 验证流程
   * @param validateFlowDto 验证请求体
   * @returns 验证结果
   */
  @Post('validate')
  @UsePipes(FlowValidationPipe)
  async validate(@Body() validateFlowDto: ValidateFlowDto) {
    return this.appsService.validateFlow(validateFlowDto);
  }

  /**
   * 预览应用流程
   * @param previewFlowDto 预览请求体
   * @param req 请求对象
   * @returns 预览结果
   */
  @Post('preview')
  @UseGuards(JwtAuthGuard)
  @UsePipes(FlowValidationPipe)
  async preview(
    @Body() previewFlowDto: PreviewFlowDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const executionResult = await this.flowService.previewFlow(
      previewFlowDto.nodes,
      previewFlowDto.edges,
      previewFlowDto.userInput,
      previewFlowDto.appId || '',
      req.user.id,
    );

    return { result: executionResult.result };
  }

  /**
   * 发布应用
   * @param id 应用ID
   * @param req 请求对象
   * @returns 发布后的应用
   */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publish(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.appsService.publish(id, req.user.id);
  }

  /**
   * 获取分享应用详情
   * @param shareId 分享ID
   * @returns 分享应用详情
   */
  @Get('share/:shareId')
  async getAppByShareId(@Param('shareId') shareId: string) {
    return this.appsService.getAppByShareId(shareId);
  }

  /**
   * 分享应用聊天
   * @param shareId 分享ID
   * @param body 聊天请求体
   * @returns 聊天结果
   */
  @Post('share/:shareId/chat')
  async shareChat(
    @Param('shareId') shareId: string,
    @Body() body: { userInput: string },
  ) {
    const app = await this.appsService.getAppByShareId(shareId);

    if (!app.nodes || !app.edges) {
      throw new BadRequestException('应用未配置流程');
    }

    const executionResult = await this.flowService.executeFlow(
      app.nodes,
      app.edges,
      body.userInput,
      app.id,
      null, // 匿名用户
    );

    return { result: executionResult.result };
  }

  /**
   * 分享应用聊天（流式）
   * @param shareId 分享ID
   * @param body 聊天请求体
   * @param res 响应对象
   * @returns 流式聊天流
   */
  @Post('share/:shareId/chat-stream')
  async shareChatStream(
    @Param('shareId') shareId: string,
    @Body() body: { userInput: string },
    @Res() res: Response,
  ) {
    const app = await this.appsService.getAppByShareId(shareId);

    if (!app.nodes || !app.edges) {
      throw new BadRequestException('应用未配置流程');
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const transformStream = new Readable({
      read() {},
    });

    let fullContent = '';

    try {
      const result = await this.flowService.executeFlow(
        app.nodes,
        app.edges,
        body.userInput,
        app.id,
        null, // 匿名用户
      );

      fullContent = result.result;

      // 流式返回最终内容
      for (let i = 0; i < fullContent.length; i++) {
        const char = fullContent[i];
        transformStream.push(`data: ${JSON.stringify({ content: char })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } catch (error) {
        fullContent = '抱歉，执行出错了，请稍后重试。';
        transformStream.push(
          `data: ${JSON.stringify({ content: fullContent })}\n\n`,
        );
      }

    transformStream.push(`data: [DONE]\n\n`);
    transformStream.push(null);

    transformStream.pipe(res);
  }
}
