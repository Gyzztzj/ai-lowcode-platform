import { Column, ColumnOptions } from 'typeorm';
import { VectorTransformer } from '../../transformers/vector.transformer';

export type Vector1536 = number[];

export function VectorColumn(
  options?: Omit<ColumnOptions, 'type' | 'transformer'>,
) {
  return Column({
    type: 'simple-json',
    transformer: new VectorTransformer(),
    ...options,
  });
}
