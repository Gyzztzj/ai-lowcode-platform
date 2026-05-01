import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RAGOrchestratorService } from '../../application/services/rag-orchestrator.service';
import {
  QueryKnowledgeBaseDto,
  RAGResponseDto,
  UploadDocumentDto,
} from '../dto/rag.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('rag')
@Controller('rag')
export class RAGController {
  private readonly logger = new Logger(RAGController.name);

  constructor(private ragOrchestrator: RAGOrchestratorService) {}

  @Post('query')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询知识库' })
  @ApiResponse({
    status: 200,
    description: '返回检索结果',
    type: RAGResponseDto,
  })
  async query(
    @Body() dto: QueryKnowledgeBaseDto,
    @Request() req: any,
  ): Promise<RAGResponseDto> {
    const { query, topK, similarityThreshold } = dto;
    const knowledgeBaseId = req.user.defaultKnowledgeBaseId;

    this.logger.log(
      `User ${req.user.id} querying knowledge base: ${query.substring(0, 50)}...`,
    );

    const results = await this.ragOrchestrator.retrieve(
      knowledgeBaseId,
      query,
      {
        topK: topK || 20,
        similarityThreshold: similarityThreshold || 0.7,
      },
    );

    return {
      query,
      retrievalResults: results,
      hasContext: results.length > 0,
      timestamp: new Date(),
    };
  }

  @Post('query/:knowledgeBaseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询指定知识库' })
  async querySpecific(
    @Param('knowledgeBaseId') knowledgeBaseId: string,
    @Body() dto: QueryKnowledgeBaseDto,
    @Request() req: any,
  ): Promise<RAGResponseDto> {
    const { query, topK, similarityThreshold } = dto;

    const results = await this.ragOrchestrator.retrieve(
      knowledgeBaseId,
      query,
      {
        topK: topK || 20,
        similarityThreshold: similarityThreshold || 0.7,
      },
    );

    return {
      query,
      retrievalResults: results,
      hasContext: results.length > 0,
      timestamp: new Date(),
    };
  }

  @Get('providers/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取嵌入提供商状态' })
  async getProviderStatus() {
    return this.ragOrchestrator['embeddingService'].getProviderStatus();
  }
}
