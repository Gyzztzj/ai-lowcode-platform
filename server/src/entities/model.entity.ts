import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ModelType } from './model-type.enum';

@Entity('model')
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'modelId' })
  modelId: string;

  @Column()
  provider: string;

  @Column({
    type: 'enum',
    enum: ModelType,
  })
  type: ModelType;

  @Column()
  apiKey: string;

  @Column()
  apiEndpoint: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  enabled: boolean;

  @Column({ name: 'isSystem', default: false })
  isSystem: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  promptTokenPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 0 })
  completionTokenPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
