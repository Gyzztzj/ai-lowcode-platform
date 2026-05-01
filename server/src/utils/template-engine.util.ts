import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TemplateEngine {
  private filters: Map<string, (value: any, ...args: any[]) => any> = new Map();

  constructor() {
    this.registerBuiltInFilters();
  }

  private registerBuiltInFilters() {
    this.filters.set('upper', (value: any) => String(value).toUpperCase());
    this.filters.set('lower', (value: any) => String(value).toLowerCase());
    this.filters.set('capitalize', (value: any) => {
      const str = String(value);
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });
    this.filters.set('trim', (value: any) => String(value).trim());
    this.filters.set('default', (value: any, defaultValue: any = '') => {
      return value !== null && value !== undefined && value !== ''
        ? value
        : defaultValue;
    });
    this.filters.set('length', (value: any) => {
      if (Array.isArray(value) || typeof value === 'string') {
        return value.length;
      }
      return 0;
    });
    this.filters.set('slice', (value: any, start: number, end?: number) => {
      if (Array.isArray(value) || typeof value === 'string') {
        return value.slice(start, end);
      }
      return value;
    });
    this.filters.set(
      'replace',
      (value: any, search: string, replace: string) => {
        return String(value).replace(new RegExp(search, 'g'), replace);
      },
    );
    this.filters.set('split', (value: any, separator: string = ',') => {
      return String(value).split(separator);
    });
    this.filters.set('join', (value: any, separator: string = ', ') => {
      if (Array.isArray(value)) {
        return value.join(separator);
      }
      return String(value);
    });
    this.filters.set('date', (value: any, format: string = 'YYYY-MM-DD') => {
      const date = value ? new Date(value) : new Date();
      if (isNaN(date.getTime())) {
        return '';
      }

      const pad = (n: number) => String(n).padStart(2, '0');

      return format
        .replace('YYYY', String(date.getFullYear()))
        .replace('MM', pad(date.getMonth() + 1))
        .replace('DD', pad(date.getDate()))
        .replace('HH', pad(date.getHours()))
        .replace('mm', pad(date.getMinutes()))
        .replace('ss', pad(date.getSeconds()));
    });
    this.filters.set('json', (value: any, indent: number = 2) => {
      try {
        return JSON.stringify(value, null, indent);
      } catch {
        return String(value);
      }
    });
    this.filters.set('md5', (value: any) => {
      return crypto.createHash('md5').update(String(value)).digest('hex');
    });
    this.filters.set('sha256', (value: any) => {
      return crypto.createHash('sha256').update(String(value)).digest('hex');
    });
    this.filters.set('number', (value: any) => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    });
    this.filters.set('round', (value: any, precision: number = 0) => {
      const num = Number(value);
      return isNaN(num) ? 0 : Number(num.toFixed(precision));
    });
    this.filters.set('ceil', (value: any) => Math.ceil(Number(value)));
    this.filters.set('floor', (value: any) => Math.floor(Number(value)));
    this.filters.set('abs', (value: any) => Math.abs(Number(value)));
  }

  render(template: string, context: Record<string, any>): string {
    if (!template) {
      return '';
    }

    let result = template;

    result = result.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), context);
        return value !== undefined && value !== null ? String(value) : '';
      } catch {
        return match;
      }
    });

    result = this.processConditionals(result, context);
    result = this.processLoops(result, context);

    return result;
  }

  private evaluateExpression(
    expression: string,
    context: Record<string, any>,
  ): any {
    if (expression.includes('|')) {
      const parts = expression.split('|').map((p) => p.trim());
      let value = this.getNestedValue(context, parts[0]);

      for (let i = 1; i < parts.length; i++) {
        const filterPart = parts[i];
        const filterMatch = filterPart.match(/^(\w+)(?:\((.*)\))?$/);

        if (filterMatch) {
          const [, filterName, filterArgsStr] = filterMatch;
          const filterArgs = filterArgsStr
            ? this.parseFilterArgs(filterArgsStr, context)
            : [];

          const filter = this.filters.get(filterName);
          if (filter) {
            value = filter(value, ...filterArgs);
          }
        }
      }

      return value;
    }

    return this.getNestedValue(context, expression);
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  private parseFilterArgs(
    argsStr: string,
    context: Record<string, any>,
  ): any[] {
    const args: any[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let depth = 0;

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if ((char === '"' || char === "'") && argsStr[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '(') depth++;
        if (char === ')') depth--;

        if (char === ',' && depth === 0) {
          args.push(this.parseArgValue(current.trim(), context));
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      args.push(this.parseArgValue(current.trim(), context));
    }

    return args;
  }

  private parseArgValue(arg: string, context: Record<string, any>): any {
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      return arg.slice(1, -1);
    }

    if (arg.toLowerCase() === 'true') return true;
    if (arg.toLowerCase() === 'false') return false;
    if (arg.toLowerCase() === 'null') return null;
    if (arg.toLowerCase() === 'undefined') return undefined;

    if (!isNaN(Number(arg))) return Number(arg);

    return this.getNestedValue(context, arg);
  }

  private processConditionals(
    template: string,
    context: Record<string, any>,
  ): string {
    let result = template;
    const maxIterations = 100;
    let iterations = 0;

    while (iterations < maxIterations) {
      const ifMatch = result.match(
        /\{%\s*if\s+([^}]+)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/,
      );

      if (!ifMatch) break;

      const [fullMatch, condition, ifContent, elseContent] = ifMatch;
      const conditionResult = this.evaluateCondition(condition, context);
      const replacement = conditionResult ? ifContent || '' : elseContent || '';

      result = result.replace(fullMatch, replacement);
      iterations++;
    }

    return result;
  }

  private evaluateCondition(
    condition: string,
    context: Record<string, any>,
  ): boolean {
    try {
      const enhancedContext = {
        ...context,
        ...context.variables,
        ...context.nodeOutputs,
      };

      const value = this.getNestedValue(enhancedContext, condition.trim());
      return Boolean(value);
    } catch {
      return false;
    }
  }

  private processLoops(template: string, context: Record<string, any>): string {
    let result = template;
    const maxIterations = 100;
    let iterations = 0;

    while (iterations < maxIterations) {
      const forMatch = result.match(
        /\{%\s*for\s+(\w+)\s+in\s+([^}]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/,
      );

      if (!forMatch) break;

      const [fullMatch, itemName, arrayName, loopContent] = forMatch;
      const array = this.getNestedValue(context, arrayName.trim());

      let replacement = '';
      if (Array.isArray(array)) {
        for (let i = 0; i < array.length; i++) {
          const loopContext = {
            ...context,
            [itemName]: array[i],
            loop: {
              index: i,
              index0: i,
              index1: i + 1,
              first: i === 0,
              last: i === array.length - 1,
              length: array.length,
            },
          };
          replacement += this.render(loopContent, loopContext);
        }
      }

      result = result.replace(fullMatch, replacement);
      iterations++;
    }

    return result;
  }

  registerFilter(
    name: string,
    filter: (value: any, ...args: any[]) => any,
  ): void {
    this.filters.set(name, filter);
  }

  hasFilter(name: string): boolean {
    return this.filters.has(name);
  }

  getFilterNames(): string[] {
    return Array.from(this.filters.keys());
  }
}
