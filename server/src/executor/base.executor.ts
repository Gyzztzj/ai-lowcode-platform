/**
 * 基础执行器
 */
import { FlowNode, ExecutionContext, NodeExecutor } from '../flow/flow.types';
import { TemplateEngine } from '../utils/template-engine.util';

export abstract class BaseExecutor implements NodeExecutor {
  protected templateEngine = new TemplateEngine();

  abstract execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext>;

  protected interpolate(
    template: string,
    context: Record<string, any>,
  ): string {
    // 使用完整的上下文，包括 variables、nodeOutputs 等
    const fullContext = {
      ...context,
      ...context.variables,
      ...context.nodeOutputs,
      userInput: context.userInput,
    };

    return this.templateEngine.render(template, fullContext);
  }
}
