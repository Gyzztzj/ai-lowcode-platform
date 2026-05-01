import { ValueTransformer } from 'typeorm';

export class PgVectorTransformer implements ValueTransformer {
  to(value: number[] | null | undefined): string | null {
    if (!value || !Array.isArray(value)) {
      return null;
    }
    return `[${value.join(',')}]`;
  }

  from(value: string | null | undefined): number[] | null {
    if (!value) {
      return null;
    }
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
