import { Injectable } from '@nestjs/common';
import { FlowNode, ExecutionContext, NodeExecutor } from '../flow/flow.types';
import { TemplateUtil } from '../utils/template.util';

@Injectable()
export class VariableSetExecutor implements NodeExecutor {
  async execute(
    node: FlowNode,
    context: ExecutionContext,
  ): Promise<ExecutionContext> {
    if (node.data.variables && Array.isArray(node.data.variables)) {
      for (const variable of node.data.variables) {
        const { name, value, type } = variable;
        if (name) {
          let parsedValue = value;

          if (typeof value === 'string') {
            parsedValue = TemplateUtil.interpolate(value, {
              ...context,
              ...context.variables,
              input: context.userInput,
            });
          }

          if (type === 'number') {
            parsedValue = Number(parsedValue);
          } else if (type === 'boolean') {
            parsedValue = parsedValue === 'true' || parsedValue === true;
          } else if (type === 'json') {
            try {
              parsedValue = JSON.parse(parsedValue);
            } catch {
              parsedValue = value;
            }
          }

          context.variables[name] = parsedValue;
        }
      }
    }

    return context;
  }
}
