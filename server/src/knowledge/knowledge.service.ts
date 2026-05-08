/**
 * 知识库服务
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { EmbeddingService } from '../ai/embedding.service';
import { RerankerService } from '../ai/reranker.service';
import { WebCrawlerService } from './web-crawler.service';
import { TextSplitterService } from '../rag/domain/services/text-splitter.service';
import {
  unlinkSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentStatus, KnowledgeBase, Document } from '../entities';
import { ChunkRepository } from '../repositories/chunk.repository';

@Injectable()
export class KnowledgeService {
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private readonly MAX_BATCH_FILES = 10;

  constructor(
    @InjectRepository(KnowledgeBase)
    private knowledgeBaseRepository: Repository<KnowledgeBase>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private chunkRepository: ChunkRepository,
    private embeddingService: EmbeddingService,
    private rerankerService: RerankerService,
    private webCrawlerService: WebCrawlerService,
    private textSplitterService: TextSplitterService,
  ) {
    // 创建上传目录
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 处理文件名编码，确保中文字符正确显示
   * @param filename 原始文件名
   * @returns 解码后的文件名
   */
  private decodeFilename(filename: string): string {
    if (!filename) return filename;

    try {
      // 尝试解码可能的百分号编码
      if (filename.includes('%')) {
        return decodeURIComponent(filename);
      }

      // 尝试解码Latin-1编码的UTF-8
      const buffer = Buffer.from(filename, 'latin1');
      const decoded = buffer.toString('utf8');

      // 验证解码是否成功（检查是否有乱码字符）
      if (/[\uFFFD]/.test(decoded)) {
        return filename;
      }

      return decoded;
    } catch {
      // 如果解码失败，返回原始文件名
      return filename;
    }
  }

  /**
   * 创建知识库
   * @param userId 用户ID
   * @param dto 创建知识库DTO
   * @returns 创建的知识库
   */
  async create(userId: string, dto: CreateKnowledgeBaseDto) {
    const newKnowledgeBase = this.knowledgeBaseRepository.create({
      ...dto,
      userId,
      isPublic: dto.isPublic ?? false,
    });
    return this.knowledgeBaseRepository.save(newKnowledgeBase);
  }

  /**
   * 获取用户的所有知识库
   * @param userId 用户ID
   * @returns 用户的所有知识库
   */
  async findAll(userId: string) {
    const knowledgeBases = await this.knowledgeBaseRepository.find({
      where: { userId },
      relations: {
        documents: true,
      },
      order: { updatedAt: 'DESC' },
    });

    // 添加文档数量统计
    return knowledgeBases.map((kb) => ({
      ...kb,
      _count: {
        documents: kb.documents?.length || 0,
      },
    }));
  }

  /**
   * 获取单个知识库详情
   * @param id 知识库ID
   * @param userId 用户ID（可选）
   * @returns 知识库详情
   */
  async findOne(id: string, userId?: string) {
    const kb = await this.knowledgeBaseRepository.findOne({
      where: { id },
      relations: {
        documents: true,
      },
    });

    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }

    if (!kb.isPublic && userId && kb.userId !== userId) {
      throw new ForbiddenException('你没有权限访问此知识库');
    }

    // 确保文档按创建时间排序
    if (kb.documents) {
      kb.documents.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return kb;
  }

  /**
   * 删除知识库
   * @param id 知识库ID
   * @param userId 用户ID
   * @returns 删除的知识库
   */
  async remove(id: string, userId: string) {
    const kb = await this.findOne(id, userId);

    await this.knowledgeBaseRepository.softDelete(id);
    return kb;
  }

  /**
   * 上传文档到知识库
   * @param knowledgeBaseId 知识库ID
   * @param userId 用户ID
   * @param file 上传的文件
   * @returns 上传的文档
   */
  async uploadDocument(
    knowledgeBaseId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    await this.findOne(knowledgeBaseId, userId);

    // 保存文件到本地
    const fileId = uuidv4();
    const originalName = this.decodeFilename(file.originalname);
    const fileExt = originalName?.split('.').pop()?.toLowerCase() || '';
    const fileName = `${fileId}.${fileExt}`;
    const filePath = join(this.uploadDir, fileName);

    writeFileSync(filePath, file.buffer);

    // 创建文档记录
    const newDocument = this.documentRepository.create({
      name: originalName,
      fileType: fileExt,
      fileSize: file.size,
      filePath,
      knowledgeBaseId,
    });
    const document = await this.documentRepository.save(newDocument);

    // 异步处理文档
    this.processDocumentAsync(document.id, filePath, fileExt).catch(
      async (error) => {
        await this.documentRepository.update(document.id, {
          status: DocumentStatus.FAILED,
        });
      },
    );

    return document;
  }

  /**
   * 批量上传文档
   * @param knowledgeBaseId 知识库ID
   * @param userId 用户ID
   * @param files 要上传的文件数组
   * @returns 上传的文档数组
   */
  async batchUploadDocuments(
    knowledgeBaseId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }
    if (files.length > this.MAX_BATCH_FILES) {
      throw new BadRequestException(
        `最多只能上传 ${this.MAX_BATCH_FILES} 个文件`,
      );
    }

    await this.findOne(knowledgeBaseId, userId);

    const documents: Document[] = [];

    for (const file of files) {
      const fileId = uuidv4();
      const originalName = this.decodeFilename(file.originalname);
      const fileExt = originalName?.split('.').pop()?.toLowerCase() || '';
      const fileName = `${fileId}.${fileExt}`;
      const filePath = join(this.uploadDir, fileName);

      writeFileSync(filePath, file.buffer);

      const newDocument = this.documentRepository.create({
        name: originalName,
        fileType: fileExt,
        fileSize: file.size,
        filePath,
        knowledgeBaseId,
      });
      const document = await this.documentRepository.save(newDocument);
      documents.push(document);

      this.processDocumentAsync(document.id, filePath, fileExt).catch(
        async (error) => {
          await this.documentRepository.update(document.id, {
            status: DocumentStatus.FAILED,
          });
        },
      );
    }

    return documents;
  }

  /**
   * 通过 URL 爬取并添加文档到知识库
   * @param knowledgeBaseId 知识库ID
   * @param userId 用户ID
   * @param url 要爬取的 URL
   * @returns 添加的文档
   */
  async addDocumentFromUrl(
    knowledgeBaseId: string,
    userId: string,
    url: string,
  ) {
    await this.findOne(knowledgeBaseId, userId);

    const {
      title,
      content,
      url: crawledUrl,
    } = await this.webCrawlerService.crawl(url);

    const newDocument = this.documentRepository.create({
      name: title,
      fileType: 'url',
      fileSize: content.length,
      filePath: crawledUrl,
      knowledgeBaseId,
    });
    const document = await this.documentRepository.save(newDocument);

    this.processTextAsync(document.id, content, crawledUrl).catch(
      async (error) => {
        await this.documentRepository.update(document.id, {
          status: DocumentStatus.FAILED,
        });
      },
    );

    return document;
  }

  /**
   * 重新处理文档到知识库
   * @param documentId 文档ID
   * @param userId 用户ID
   * @returns 重新处理后的文档
   */
  async reprocessDocument(documentId: string, userId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: { knowledgeBase: true },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.knowledgeBase.userId !== userId) {
      throw new ForbiddenException('你没有权限操作此文档');
    }

    if (!document.filePath) {
      throw new BadRequestException('找不到原始文件，无法重新处理');
    }

    if (!existsSync(document.filePath)) {
      throw new BadRequestException('原始文件已丢失，无法重新处理');
    }

    await this.chunkRepository.deleteChunksByDocumentId(documentId);

    await this.documentRepository.update(documentId, {
      status: DocumentStatus.PROCESSING,
      chunkCount: 0,
    });

    this.processDocumentAsync(
      documentId,
      document.filePath,
      document.fileType,
    ).catch(async (error) => {
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.FAILED,
      });
    });

    return this.documentRepository.findOne({ where: { id: documentId } });
  }

  /**
   * 异步处理文档到知识库
   * @param documentId 文档ID
   * @param filePath 文档文件路径
   * @param fileType 文档文件类型
   */
  private async processDocumentAsync(
    documentId: string,
    filePath: string,
    fileType: string,
  ) {
    try {
      let text = '';

      if (['txt', 'md'].includes(fileType)) {
        if (!existsSync(filePath)) {
          throw new Error(`文件不存在: ${filePath}`);
        }
        text = readFileSync(filePath, 'utf-8');
      } else if (fileType === 'pdf') {
        try {
          const pdfParse = require('pdf-parse');
          const dataBuffer = readFileSync(filePath);
          const data = await pdfParse(dataBuffer);
          text = data.text;
          // 如果提取的内容太短，尝试添加元数据信息
          if (text.length < 50) {
            const metaInfo =
              `文档标题: ${data.info?.Title || '未知'}\n` +
              `作者: ${data.info?.Author || '未知'}\n` +
              `创建时间: ${data.info?.CreationDate || '未知'}\n` +
              `页面数: ${data.numpages || '未知'}\n`;
            text = metaInfo + (text || '');
          }
        } catch (pdfError) {
          text = `这是一个 PDF 文件，解析失败。为了更好的文档解析效果，建议将文件内容转换为纯文本格式后上传。`;
        }
      } else if (['docx', 'doc'].includes(fileType)) {
        try {
          const mammoth = require('mammoth');
          const dataBuffer = readFileSync(filePath);
          const { value } = await mammoth.extractRawText({
            buffer: dataBuffer,
          });
          text = value;
        } catch (docError) {
          text = `这是一个 ${fileType} 文件，解析失败。为了更好的文档解析效果，建议将文件内容转换为纯文本格式后上传。`;
        }
      } else {
        text = `这是一个 ${fileType} 文件。为了更好的文档解析效果，建议将文件内容转换为纯文本格式后上传。`;
      }

      await this.processTextContentAsync(documentId, text, filePath);
    } catch (error) {
      try {
        await this.documentRepository.update(documentId, {
          status: DocumentStatus.FAILED,
          chunkCount: 0,
        });
      } catch (updateError) {}
    }
  }

  /**
   * 异步处理纯文本内容到知识库
   * @param documentId 文档ID
   * @param text 要处理的纯文本内容
   * @param sourceUrl 文档来源URL
   */
  private async processTextAsync(
    documentId: string,
    text: string,
    sourceUrl: string,
  ) {
    try {
      await this.processTextContentAsync(documentId, text, sourceUrl);
    } catch (error) {
      try {
        await this.documentRepository.update(documentId, {
          status: DocumentStatus.FAILED,
          chunkCount: 0,
        });
      } catch (updateError) {}
    }
  }

  /**
   * 公共的文本处理逻辑到知识库
   * @param documentId 文档ID
   * @param text 要处理的纯文本内容
   * @param source 文档来源URL
   */
  private async processTextContentAsync(
    documentId: string,
    text: string,
    source: string,
  ) {
    if (!text || text.trim().length === 0) {
      text = `来源: ${source}\n虽然未能提取到有效文本内容，但已为您创建文档记录。`;
    }

    const chunks = this.textSplitterService.splitText(text);

    if (chunks.length === 0) {
      await this.documentRepository.update(documentId, {
        status: DocumentStatus.FAILED,
        chunkCount: 0,
      });
      return;
    }

    let successCount = 0;

    for (const chunk of chunks) {
      try {
        const vector = await this.embeddingService.createEmbedding(
          chunk.content,
        );

        await this.chunkRepository.saveChunkWithVector({
          content: chunk.content,
          vector,
          documentId,
        });

        successCount++;
      } catch (chunkError) {}
    }

    await this.documentRepository.update(documentId, {
      status: DocumentStatus.SUCCESS,
      chunkCount: successCount,
    });
  }

  /**
   * 删除文档到知识库
   * @param documentId 文档ID
   * @param userId 用户ID
   * @returns 删除的文档
   */
  async deleteDocument(documentId: string, userId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: { knowledgeBase: true },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.knowledgeBase.userId !== userId) {
      throw new ForbiddenException('你没有权限删除此文档');
    }

    await this.chunkRepository.deleteChunksByDocumentId(documentId);

    if (document.filePath && existsSync(document.filePath)) {
      try {
        unlinkSync(document.filePath);
      } catch (e) {}
    }

    await this.documentRepository.delete(documentId);
    return document;
  }

  /**
   * 语义检索
   * @param knowledgeBaseId 知识库ID
   * @param query 搜索查询
   * @param topK 返回的文档数量
   * @param similarityThreshold 相似阈值
   * @param userId 用户ID
   * @returns 搜索结果
   */
  async retrieve(
    knowledgeBaseId: string,
    query: string,
    topK: number = 20,
    similarityThreshold: number = 0.3,
    userId?: string,
  ) {
    await this.findOne(knowledgeBaseId, userId);

    const queryVector = await this.embeddingService.createEmbedding(query);

    const results = await this.chunkRepository.similaritySearch(
      queryVector,
      knowledgeBaseId,
      topK,
      similarityThreshold,
    );

    return results;
  }

  /**
   * 检索并重排序到知识库
   * @param knowledgeBaseId 知识库ID
   * @param query 搜索查询
   * @param topK 返回的文档数量
   * @param topN 重排序后的文档数量
   * @param similarityThreshold 相似阈值
   * @param userId 用户ID
   * @returns 搜索结果
   */
  async retrieveWithRerank(
    knowledgeBaseId: string,
    query: string,
    topK: number = 20,
    topN: number = 5,
    similarityThreshold: number = 0.3,
    userId?: string,
  ) {
    await this.findOne(knowledgeBaseId, userId);

    const candidates = await this.retrieve(
      knowledgeBaseId,
      query,
      topK,
      similarityThreshold,
    );

    if (candidates.length === 0) {
      return [];
    }

    const documents = candidates.map((c) => c.content);
    const rerankResults = await this.rerankerService.rerank(query, documents, {
      topN,
    });

    const finalResults = rerankResults.map((result) => ({
      ...candidates[result.index],
      relevance_score: result.relevance_score,
    }));

    return finalResults;
  }
}
