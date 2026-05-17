import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Headers,
  Ip,
} from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

@Controller('v1')
@UseGuards(ApiKeyGuard, RateLimitGuard)
export class OpenAiController {
  constructor(private readonly openAiService: OpenaiService) {}

  @Post('chat/completions')
  @HttpCode(HttpStatus.OK)
  @RateLimit(100, 60) // 每分钟 100 次请求
  async createChatCompletion(
    @Request() req,
    @Body() dto: ChatCompletionDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.openAiService.createChatCompletion(
      dto,
      req.user,
      req.apiKey,
      ip,
      userAgent,
    );
  }

  @Get('models')
  @RateLimit(100, 60) // 每分钟 100 次请求
  async listModels(@Request() req) {
    return this.openAiService.listModels(req.user);
  }

  @Get('models/:modelId')
  @RateLimit(100, 60) // 每分钟 100 次请求
  async retrieveModel(@Request() req, @Param('modelId') modelId: string) {
    return this.openAiService.retrieveModel(modelId, req.user);
  }
}
