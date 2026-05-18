/**
 * 应用服务（用于管理应用）
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { ValidateFlowDto } from './dto/validate-flow.dto';
import { v4 as uuidv4 } from 'uuid';
import { FlowEdge, FlowNode, NodeType } from '../flow/flow.types';
import { App, Model } from '../entities';
import { FlowService } from '../flow/flow.service';
import { OpenApiService } from '../public-api/openapi.service';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
    private flowService: FlowService,
    private openApiService: OpenApiService,
  ) {}

  /**
   * 验证应用模型
   * @param dto 创建或更新应用的DTO
   */
  private async validateModels(dto: CreateAppDto | UpdateAppDto) {
    if (dto.defaultModel) {
      const model = await this.modelRepository.findOne({
        where: { id: dto.defaultModel },
      });
      if (!model) {
        throw new BadRequestException('默认模型不存在');
      }
      if (!model.enabled) {
        throw new BadRequestException('默认模型未启用');
      }
      if (model.type === 'EMBEDDING') {
        throw new BadRequestException('默认模型不能是向量模型');
      }
    }
    if (
      dto.embeddingModel &&
      dto.embeddingModel.trim() !== '' &&
      dto.embeddingModel !== 'none'
    ) {
      const model = await this.modelRepository.findOne({
        where: { id: dto.embeddingModel },
      });
      if (!model) {
        throw new BadRequestException('向量模型不存在');
      }
      if (!model.enabled) {
        throw new BadRequestException('向量模型未启用');
      }
      if (model.type !== 'EMBEDDING') {
        throw new BadRequestException('向量模型必须是EMBEDDING类型');
      }
    }
  }

  /**
   * 创建应用
   * @param userId 用户ID
   * @param createAppDto 创建应用的DTO
   * @returns 创建的应用
   */
  async create(userId: string, createAppDto: CreateAppDto) {
    await this.validateModels(createAppDto);
    // 将 "none" 转换为 null
    const dto = {
      ...createAppDto,
      embeddingModel:
        createAppDto.embeddingModel === 'none'
          ? null
          : createAppDto.embeddingModel,
    };
    const newApp = this.appRepository.create({
      ...dto,
      userId,
    });
    return this.appRepository.save(newApp);
  }

  /**
   * 获取用户所有应用
   * @param userId 用户ID
   * @returns 用户的所有应用
   */
  async findAll(userId: string) {
    return this.appRepository.find({
      where: [{ userId }, { isPublic: true }],
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * 获取应用详情
   * @param id 应用ID
   * @param userId 用户ID
   * @returns 应用详情
   */
  async findOne(id: string, userId: string) {
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    if (app.userId !== userId && !app.isPublic) {
      throw new ForbiddenException('你没有权限访问此应用');
    }

    return app;
  }

  /**
   * 更新应用
   * @param id 应用ID
   * @param userId 用户ID
   * @param updateAppDto 更新应用的DTO
   * @returns 更新后的应用
   */
  async update(id: string, userId: string, updateAppDto: UpdateAppDto) {
    const app = await this.findOne(id, userId);

    if (app.userId !== userId) {
      throw new ForbiddenException('你没有权限编辑此应用');
    }

    await this.validateModels(updateAppDto);
    // 将 "none" 转换为 null
    const dto = {
      ...updateAppDto,
      embeddingModel:
        updateAppDto.embeddingModel === 'none'
          ? null
          : updateAppDto.embeddingModel,
    };
    await this.appRepository.update(id, dto);
    return this.findOne(id, userId);
  }

  /**
   * 删除应用
   * @param id 应用ID
   * @param userId 用户ID
   * @returns 删除的应用
   */
  async remove(id: string, userId: string) {
    const app = await this.findOne(id, userId);

    if (app.userId !== userId) {
      throw new ForbiddenException('你没有权限删除此应用');
    }

    await this.appRepository.softDelete(id);
    return app;
  }

  /**
   * 保存应用工作流
   * @param id 应用ID
   * @param userId 用户ID
   * @param nodes 工作流节点
   * @param edges 工作流边
   * @returns 保存后的应用
   */
  async saveFlow(
    id: string,
    userId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
  ) {
    const app = await this.findOne(id, userId);

    if (app.userId !== userId) {
      throw new ForbiddenException('你没有权限编辑此应用');
    }

    await this.appRepository.update(id, {
      nodes,
      edges,
    });
    return this.findOne(id, userId);
  }

  /**
   * 发布应用
   * @param id 应用ID
   * @param userId 用户ID
   * @returns 发布后的应用
   */
  async publish(id: string, userId: string) {
    const app = await this.findOne(id, userId);

    if (app.userId !== userId) {
      throw new ForbiddenException('你没有权限发布此应用');
    }

    const shareId = uuidv4().slice(0, 8);

    const openApiSpec = await this.openApiService.generateAppOpenApiSpec(id, userId);

    await this.appRepository.update(id, {
      isPublic: true,
      shareId,
      openApiSpec,
    });
    return this.findOne(id, userId);
  }

  /**
   * 根据分享ID获取应用
   * @param shareId 分享ID
   * @returns 应用详情
   */
  async getAppByShareId(shareId: string) {
    const app = await this.appRepository.findOne({
      where: { shareId },
    });

    if (!app || !app.isPublic) {
      throw new NotFoundException('应用不存在或未发布');
    }

    return app;
  }

  /**
   * 验证应用工作流
   * @param validateFlowDto 验证应用流的DTO
   * @returns 验证结果
   */
  validateFlow(validateFlowDto: ValidateFlowDto) {
    const { nodes, edges } = validateFlowDto;
    const errors: string[] = [];

    // 检查开始节点
    const startNodes = nodes.filter(
      (node) => node.type === NodeType.START || node.type === 'start',
    );
    if (startNodes.length === 0) {
      errors.push('缺少开始节点');
    } else if (startNodes.length > 1) {
      errors.push(`有${startNodes.length}个开始节点，只能有1个`);
    }

    // 检查结束节点
    const endNodes = nodes.filter(
      (node) => node.type === NodeType.END || node.type === 'end',
    );
    if (endNodes.length === 0) {
      errors.push('缺少结束节点');
    } else if (endNodes.length > 1) {
      errors.push(`有${endNodes.length}个结束节点，只能有1个`);
    }

    // 检查循环
    if (this.hasCycle(nodes, edges)) {
      errors.push('工作流包含循环');
    }

    // 检查边的有效性
    const nodeIds = new Set(nodes.map((node) => node.id));
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`边 ${edge.id} 的源节点 ${edge.source} 不存在`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`边 ${edge.id} 的目标节点 ${edge.target} 不存在`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查应用工作流是否包含循环
   * @param nodes 工作流节点
   * @param edges 工作流边
   * @returns 是否包含循环
   */
  private hasCycle(nodes: FlowNode[], edges: FlowEdge[]): boolean {
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // 初始化
    for (const node of nodes) {
      adjacency.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    // 构建图
    for (const edge of edges) {
      const targets = adjacency.get(edge.source) || [];
      targets.push(edge.target);
      adjacency.set(edge.source, targets);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Kahn's 算法
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    let count = 0;
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      count++;

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighborId of neighbors) {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    return count !== nodes.length;
  }

  /**
   * 执行应用
   * @param appId 应用ID
   * @param userId 用户ID
   * @param userInput 用户输入
   * @returns 应用执行结果
   */
  async executeApp(
    appId: string,
    userId: string,
    userInput: string,
  ): Promise<string> {
    const app = await this.findOne(appId, userId);
    const nodes = app.nodes || [];
    const edges = app.edges || [];

    if (nodes.length === 0) {
      throw new Error('应用没有配置工作流');
    }

    const result = await this.flowService.executeFlow(
      nodes,
      edges,
      userInput,
      appId,
      userId,
    );

    return result.result || '';
  }
}
