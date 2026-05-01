import { Controller, Post, Body, UseGuards, Get, Res } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { Response } from 'express';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  // 普通对话
  @Post('chat')
  async chat(@Body() chatDto: ChatDto) {
    return (await this.aiService.chat(chatDto)) as {
      content: string;
      model?: string;
      usage?: unknown;
    };
  }

  // 流式对话
  @Post('chat-stream')
  async chatStream(@Body() chatDto: ChatDto, @Res() res: Response) {
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲

    const stream = await this.aiService.streamChat(chatDto);

    stream.pipe(res);

    // 客户端断开连接时清理资源
    res.on('close', () => {
      stream.destroy();
    });
  }

  // 获取可用的AI模型
  @Get('models')
  getAvailableModels() {
    return {
      models: this.aiService.getAvailableModels(),
    };
  }
}
