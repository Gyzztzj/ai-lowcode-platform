import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';
import { PgVectorTransformer } from '../transformers/pgvector.transformer';

@Entity('chunk')
export class Chunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'simple-json',
    nullable: true,
    comment: '向量数据缓存，用于应用层访问',
  })
  vectorCache: number[] | null;

  @Column({
    type: 'vector',
    length: 1024,
    nullable: true,
    transformer: new PgVectorTransformer(),
  })
  vector: number[] | null;

  @Column({
    type: 'simple-json',
    nullable: true,
    comment: '分块元数据，包括位置、索引等信息',
  })
  metadata: Record<string, any> | null;

  @Column()
  documentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Document, (document) => document.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: Document;
}
