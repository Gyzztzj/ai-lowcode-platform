/**
 * 条件执行器
 */
import { Injectable } from '@nestjs/common';
import { BaseExecutor } from './base.executor';
import { FlowNode, ExecutionContext } from '../flow/flow.types';
import { ExpressionEvaluator } from '../utils/expression-evaluator.util';

@Injectable()
export class ConditionExecutor extends BaseExecutor {
  constructor(private expressionEvaluator: ExpressionEvaluator) {
    super();
  }

  /**
   * 执行条件节点
   * @param node 条件节点
   * @param context 执行上下文
   * @returns 更新后的执行上下文
   */
  async execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    const { conditions, defaultBranch, branches } = node.data;

    let selectedBranchId = defaultBranch;
    let selectedBranchLabel = '默认分支';

    const conditionContext = {
      ...context,
      ...context.variables,
      ...context.nodeOutputs,
      input: context.userInput,
    };

    if (branches && Array.isArray(branches)) {
      for (let i = 0; i < branches.length; i++) {
        const branch = branches[i];

        if (branch.condition) {
          const isMatch = this.evaluateCondition(
            branch.condition,
            conditionContext,
          );

          if (isMatch) {
            // 关键：selectedBranchId 应该是分支的 id，而不是 targetNodeId
            // 这样 getNextNodeId 才能通过 sourceHandle 正确匹配连线
            selectedBranchId = branch.id;
            selectedBranchLabel = branch.label || branch.id;
            break;
          }
        }
      }
    } else if (conditions && Array.isArray(conditions)) {
      for (const condition of conditions) {
        if (condition.expression) {
          const isMatch = this.evaluateCondition(
            condition.expression,
            conditionContext,
          );
          if (isMatch) {
            selectedBranchId = condition.targetNodeId;
            selectedBranchLabel = condition.label || condition.id;
            break;
          }
        }
      }
    }

    if (selectedBranchLabel === '默认分支') {
      // 设置 selectedBranchId 为 'default'，这样 getNextNodeId 可以匹配 sourceHandle
      selectedBranchId = 'default';
    }

    const newContext = {
      ...context,
      metadata: {
        ...context.metadata,
        selectedBranchId,
        selectedBranchLabel,
        conditionNodeId: node.id,
      },
    };

    newContext.nodeOutputs[node.id] = {
      selectedBranchId,
      selectedBranchLabel,
    };

    return newContext;
  }

  /**
   * 评估条件表达式
   * @param expression 条件表达式
   * @param context 执行上下文
   * @returns 是否匹配
   */
  private evaluateCondition(
    expression: string,
    context: Record<string, any>,
  ): boolean {
    try {
      // 先尝试简单比较（支持 contains）
      const simpleResult = this.trySimpleComparison(expression, context);
      if (simpleResult !== null) {
        return simpleResult;
      }

      // 先处理变量插值 {{variable}}
      const processedExpression = this.interpolateVariables(
        expression,
        context,
      );

      // 直接使用表达式求值器处理所有情况
      const result = this.expressionEvaluator.evaluateWithFunctions(
        processedExpression,
        context,
      );

      return Boolean(result);
    } catch (error) {
      return false;
    }
  }

  /**
   * 插值变量表达式中的 {{variable}}
   * @param expression 表达式
   * @param context 执行上下文
   * @returns 插值后的表达式
   */
  private interpolateVariables(
    expression: string,
    context: Record<string, any>,
  ): string {
    const result = expression.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();

      // 尝试直接从 context 中获取
      let value = context[trimmedName];

      // 如果找不到，尝试从 context.variables 获取
      if (value === undefined && context.variables) {
        value = context.variables[trimmedName];
      }

      // 如果还找不到，尝试从 context.nodeOutputs 获取
      if (value === undefined && context.nodeOutputs) {
        value = context.nodeOutputs[trimmedName];
      }

      return value !== undefined && value !== null ? String(value) : '';
    });
    return result;
  }

  /**
   * 获取嵌套对象的值
   * @param obj 对象
   * @param path 路径，例如 'a.b.c'
   * @returns 嵼
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * 尝试简单比较（支持 contains）
   * @param expression 表达式
   * @param context 执行上下文
   * @returns 是否匹配
   */
  private trySimpleComparison(
    expression: string,
    context: Record<string, any>,
  ): boolean | null {
    // 检查是否是 OR 表达式
    if (expression.toLowerCase().includes(' or ')) {
      const conditions = expression.split(/\s+or\s+/i);

      for (const condition of conditions) {
        const result = this.evaluateSingleCondition(condition.trim(), context);
        if (result === true) {
          return true;
        }
      }
      return false;
    }

    // 检查是否是 AND 表达式
    if (expression.toLowerCase().includes(' and ')) {
      const conditions = expression.split(/\s+and\s+/i);

      for (const condition of conditions) {
        const result = this.evaluateSingleCondition(condition.trim(), context);
        if (result === false) {
          return false;
        }
      }
      return true;
    }

    // 单个条件
    return this.evaluateSingleCondition(expression, context);
  }

  /**
   * 评估单个条件表达式
   * @param expression 条件表达式
   * @param context 执行上下文
   * @returns 是否匹配
   */
  private evaluateSingleCondition(
    expression: string,
    context: Record<string, any>,
  ): boolean | null {
    // 先插值处理
    const processedExpr = this.interpolateVariables(expression, context);

    // 检查包含关系
    const containsMatch = processedExpr.match(/^(.+)\s+contains\s+(.+)$/i);
    if (containsMatch) {
      const [, left, right] = containsMatch;
      const leftValue = this.resolveValue(left.trim(), context);
      const rightValue = this.resolveValue(right.trim(), context);
      const result = String(leftValue).includes(String(rightValue));
      return result;
    }

    // 检查相等关系 ==
    const equalMatch = processedExpr.match(/^(.+)\s*==\s*(.+)$/);
    if (equalMatch) {
      const [, left, right] = equalMatch;
      const leftValue = this.resolveValue(left.trim(), context);
      const rightValue = this.resolveValue(right.trim(), context);
      return leftValue == rightValue;
    }

    // 检查不等于 !=
    const notEqualMatch = processedExpr.match(/^(.+)\s*!=\s*(.+)$/);
    if (notEqualMatch) {
      const [, left, right] = notEqualMatch;
      const leftValue = this.resolveValue(left.trim(), context);
      const rightValue = this.resolveValue(right.trim(), context);
      return leftValue != rightValue;
    }

    return null;
  }

  /**
   * 解析值为实际类型
   * @param value 原始值
   * @param context 执行上下文
   * @returns 解析后的值
   */
  private resolveValue(value: string, context: Record<string, any>): any {
    // 检查是否是字符串字面量
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    // 检查是否是数字
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // 检查布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    return value;
  }
}
