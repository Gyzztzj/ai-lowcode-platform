import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { CrawlUrlDto } from './dto/crawl-url.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EmbeddingService } from '../ai/embedding.service';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Post()
  create(
    @Request() req,
    @Body() createKnowledgeBaseDto: CreateKnowledgeBaseDto,
  ) {
    return this.knowledgeService.create(req.user.id, createKnowledgeBaseDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.knowledgeService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.knowledgeService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.knowledgeService.remove(id, req.user.id);
  }

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  uploadDocument(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.knowledgeService.uploadDocument(id, req.user.id, file);
  }

  @Post(':id/documents/batch')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  batchUploadDocuments(
    @Param('id') id: string,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.knowledgeService.batchUploadDocuments(id, req.user.id, files);
  }

  @Post(':id/documents/url')
  addDocumentFromUrl(
    @Param('id') id: string,
    @Request() req,
    @Body() crawlUrlDto: CrawlUrlDto,
  ) {
    return this.knowledgeService.addDocumentFromUrl(
      id,
      req.user.id,
      crawlUrlDto.url,
    );
  }

  @Post('documents/:id/reprocess')
  reprocessDocument(@Param('id') id: string, @Request() req) {
    return this.knowledgeService.reprocessDocument(id, req.user.id);
  }

  @Delete('documents/:id')
  deleteDocument(@Param('id') id: string, @Request() req) {
    return this.knowledgeService.deleteDocument(id, req.user.id);
  }

  @Post(':id/retrieve')
  async retrieve(
    @Param('id') id: string,
    @Request() req,
    @Body()
    body: { query: string; topK?: number; topN?: number; threshold?: number },
  ) {
    const results = await this.knowledgeService.retrieveWithRerank(
      id,
      body.query,
      body.topK || 20,
      body.topN || 5,
      body.threshold || 0.7,
      req.user.id,
    );

    return results;
  }

  @Post('test-embedding')
  async testEmbedding(@Body() body: { text: string }) {
    try {
      const embedding = await this.embeddingService.createEmbedding(
        body.text || '测试文本',
      );

      return {
        success: true,
        provider: this.embeddingService.getCurrentProvider(),
        dimension: embedding.length,
        embeddingPreview: embedding.slice(0, 10),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
