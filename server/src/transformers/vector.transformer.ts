import { ValueTransformer } from 'typeorm';

export class VectorTransformer implements ValueTransformer {
  to(value: number[]): string {
    return `[${value.join(',')}]`;
  }

  from(value: string): number[] {
    return JSON.parse(value);
  }
}
