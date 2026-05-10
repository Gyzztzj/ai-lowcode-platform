import { Injectable } from '@nestjs/common';

@Injectable()
export class ExpressionEvaluator {
  private operators = {
    '==': (a: any, b: any) => a == b,
    '===': (a: any, b: any) => a === b,
    '!=': (a: any, b: any) => a != b,
    '!==': (a: any, b: any) => a !== b,
    '>': (a: any, b: any) => a > b,
    '<': (a: any, b: any) => a < b,
    '>=': (a: any, b: any) => a >= b,
    '<=': (a: any, b: any) => a <= b,
    '&&': (a: any, b: any) => a && b,
    '||': (a: any, b: any) => a || b,
    contains: (a: any, b: any) => a && b && String(a).includes(String(b)),
    startsWith: (a: any, b: any) => a && b && String(a).startsWith(String(b)),
    endsWith: (a: any, b: any) => a && b && String(a).endsWith(String(b)),
  };

  evaluate(expression: string, context: Record<string, any>): boolean {
    try {
      const tokens = this.tokenize(expression);
      const ast = this.parse(tokens);
      return this.evaluateAST(ast, context);
    } catch (_error) {
      return false;
    }
  }

  private tokenize(expression: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let i = 0;

    // 定义需要特殊处理的操作符
    const specialOperators = ['contains', 'startsWith', 'endsWith'];

    while (i < expression.length) {
      const char = expression[i];

      if (char === ' ') {
        if (current) {
          // 检查是否是特殊操作符
          const lowerCurrent = current.toLowerCase();
          if (lowerCurrent === 'or') {
            tokens.push('||');
          } else if (lowerCurrent === 'and') {
            tokens.push('&&');
          } else if (specialOperators.includes(lowerCurrent)) {
            tokens.push(lowerCurrent);
          } else {
            tokens.push(current);
          }
          current = '';
        }
        i++;
        continue;
      }

      if (char === '(' || char === ')') {
        if (current) {
          const lowerCurrent = current.toLowerCase();
          if (lowerCurrent === 'or') {
            tokens.push('||');
          } else if (lowerCurrent === 'and') {
            tokens.push('&&');
          } else if (specialOperators.includes(lowerCurrent)) {
            tokens.push(lowerCurrent);
          } else {
            tokens.push(current);
          }
          current = '';
        }
        tokens.push(char);
        i++;
        continue;
      }

      if (char === '&' && expression[i + 1] === '&') {
        if (current) {
          const lowerCurrent = current.toLowerCase();
          if (lowerCurrent === 'or') {
            tokens.push('||');
          } else if (lowerCurrent === 'and') {
            tokens.push('&&');
          } else if (specialOperators.includes(lowerCurrent)) {
            tokens.push(lowerCurrent);
          } else {
            tokens.push(current);
          }
          current = '';
        }
        tokens.push('&&');
        i += 2;
        continue;
      }

      if (char === '|' && expression[i + 1] === '|') {
        if (current) {
          const lowerCurrent = current.toLowerCase();
          if (lowerCurrent === 'or') {
            tokens.push('||');
          } else if (lowerCurrent === 'and') {
            tokens.push('&&');
          } else if (specialOperators.includes(lowerCurrent)) {
            tokens.push(lowerCurrent);
          } else {
            tokens.push(current);
          }
          current = '';
        }
        tokens.push('||');
        i += 2;
        continue;
      }

      if (char === '=' && expression[i + 1] === '=') {
        if (current) {
          const lowerCurrent = current.toLowerCase();
          if (lowerCurrent === 'or') {
            tokens.push('||');
          } else if (lowerCurrent === 'and') {
            tokens.push('&&');
          } else if (specialOperators.includes(lowerCurrent)) {
            tokens.push(lowerCurrent);
          } else {
            tokens.push(current);
          }
          current = '';
        }
        if (expression[i + 2] === '=') {
          tokens.push('===');
          i += 3;
        } else {
          tokens.push('==');
          i += 2;
        }
        continue;
      }

      if (char === '!' && expression[i + 1] === '=') {
        if (current) {
          const lowerCurrent = current.toLowerCase();
          if (lowerCurrent === 'or') {
            tokens.push('||');
          } else if (lowerCurrent === 'and') {
            tokens.push('&&');
          } else if (specialOperators.includes(lowerCurrent)) {
            tokens.push(lowerCurrent);
          } else {
            tokens.push(current);
          }
          current = '';
        }
        if (expression[i + 2] === '=') {
          tokens.push('!==');
          i += 3;
        } else {
          tokens.push('!=');
          i += 2;
        }
        continue;
      }

      if (char === '>' || char === '<') {
        if (current) {
          const lowerCurrent = current.toLowerCase();
          if (lowerCurrent === 'or') {
            tokens.push('||');
          } else if (lowerCurrent === 'and') {
            tokens.push('&&');
          } else if (specialOperators.includes(lowerCurrent)) {
            tokens.push(lowerCurrent);
          } else {
            tokens.push(current);
          }
          current = '';
        }
        if (expression[i + 1] === '=') {
          tokens.push(char + '=');
          i += 2;
        } else {
          tokens.push(char);
          i++;
        }
        continue;
      }

      current += char;
      i++;
    }

    if (current) {
      const lowerCurrent = current.toLowerCase();
      if (lowerCurrent === 'or') {
        tokens.push('||');
      } else if (lowerCurrent === 'and') {
        tokens.push('&&');
      } else if (specialOperators.includes(lowerCurrent)) {
        tokens.push(lowerCurrent);
      } else {
        tokens.push(current);
      }
    }

    return tokens;
  }

  private parse(tokens: string[]): any {
    let index = 0;

    const parseExpression = (): any => {
      let left = parseTerm();

      while (index < tokens.length && tokens[index] === '||') {
        const operator = tokens[index];
        index++;
        const right = parseTerm();
        left = { type: 'binary', operator, left, right };
      }

      return left;
    };

    const parseTerm = (): any => {
      let left = parseFactor();

      while (index < tokens.length && tokens[index] === '&&') {
        const operator = tokens[index];
        index++;
        const right = parseFactor();
        left = { type: 'binary', operator, left, right };
      }

      return left;
    };

    const parseFactor = (): any => {
      if (tokens[index] === '(') {
        index++;
        const expr = parseExpression();
        if (tokens[index] !== ')') {
          throw new Error('缺少右括号');
        }
        index++;
        return expr;
      }

      if (tokens[index] === '!') {
        index++;
        const operand = parseFactor();
        return { type: 'unary', operator: '!', operand };
      }

      return parseComparison();
    };

    const parseComparison = (): any => {
      const left = parseValue();

      const comparisonOperators = [
        '==',
        '===',
        '!=',
        '!==',
        '>',
        '<',
        '>=',
        '<=',
        'contains',
        'startsWith',
        'endsWith',
      ];
      if (
        index < tokens.length &&
        comparisonOperators.includes(tokens[index])
      ) {
        const operator = tokens[index];
        index++;
        const right = parseValue();
        return { type: 'binary', operator, left, right };
      }

      return left;
    };

    const parseValue = (): any => {
      const token = tokens[index];
      index++;

      if (token.startsWith('"') || token.startsWith("'")) {
        return { type: 'literal', value: token.slice(1, -1) };
      }

      if (!isNaN(Number(token))) {
        return { type: 'literal', value: Number(token) };
      }

      if (token.toLowerCase() === 'true') {
        return { type: 'literal', value: true };
      }

      if (token.toLowerCase() === 'false') {
        return { type: 'literal', value: false };
      }

      if (token.toLowerCase() === 'null') {
        return { type: 'literal', value: null };
      }

      if (token.toLowerCase() === 'undefined') {
        return { type: 'literal', value: undefined };
      }

      return { type: 'variable', name: token };
    };

    return parseExpression();
  }

  private evaluateAST(node: any, context: Record<string, any>): any {
    switch (node.type) {
      case 'literal':
        return node.value;

      case 'variable':
        return this.getNestedValue(context, node.name);

      case 'unary':
        const operandValue = this.evaluateAST(node.operand, context);
        if (node.operator === '!') {
          return !operandValue;
        }
        return operandValue;

      case 'binary':
        const leftValue = this.evaluateAST(node.left, context);
        const rightValue = this.evaluateAST(node.right, context);
        const operator =
          this.operators[node.operator as keyof typeof this.operators];
        if (operator) {
          return operator(leftValue, rightValue);
        }
        return false;

      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  evaluateWithFunctions(
    expression: string,
    context: Record<string, any>,
  ): boolean {
    const functions = {
      contains: (str: string, substr: string) =>
        str && substr && String(str).includes(String(substr)),
      startsWith: (str: string, prefix: string) =>
        str && prefix && String(str).startsWith(String(prefix)),
      endsWith: (str: string, suffix: string) =>
        str && suffix && String(str).endsWith(String(suffix)),
      length: (str: any) => (str ? String(str).length : 0),
      toLowerCase: (str: any) => (str ? String(str).toLowerCase() : ''),
      toUpperCase: (str: any) => (str ? String(str).toUpperCase() : ''),
      isEmpty: (value: any) =>
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0),
      isNotEmpty: (value: any) => !functions.isEmpty(value),
      in: (value: any, ...list: any[]) => list.includes(value),
      notIn: (value: any, ...list: any[]) => !list.includes(value),
      matches: (str: string, pattern: string) => {
        try {
          return new RegExp(pattern).test(String(str));
        } catch {
          return false;
        }
      },
    };

    const enhancedContext = { ...context, ...functions };
    return this.evaluate(expression, enhancedContext);
  }
}
