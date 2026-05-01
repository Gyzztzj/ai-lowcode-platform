export class TemplateUtil {
  static interpolate(template: string, context: Record<string, any>): string {
    let result = template;

    // 先处理 ${变量} 语法
    result = result.replace(/\${([^}]+)}/g, (match, path) => {
      try {
        const value = this.getNestedValue(context, path.trim());
        return value !== undefined && value !== null ? String(value) : '';
      } catch {
        return match;
      }
    });

    // 再处理 {{变量}} 语法
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      try {
        const value = this.getNestedValue(context, path.trim());
        return value !== undefined && value !== null ? String(value) : '';
      } catch {
        return match;
      }
    });

    return result;
  }

  private static getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  static parseCondition(
    conditionStr: string,
    context: Record<string, any>,
  ): boolean {
    try {
      const interpolated = this.interpolate(conditionStr, context);
      const result = Function('"use strict"; return (' + interpolated + ')')();
      return Boolean(result);
    } catch {
      return false;
    }
  }
}
