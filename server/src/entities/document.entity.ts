import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DocumentStatus } from './document-status.enum';
import { KnowledgeBase } from './knowledge-base.entity';
import { Chunk } from './chunk.entity';

@Entity('document')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  fileType: string;

  @Column()
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  filePath: string | null;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PROCESSING,
  })
  status: DocumentStatus;

  @Column({ type: 'int', nullable: true })
  chunkCount: number | null;

  @Column()
  knowledgeBaseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => KnowledgeBase, (knowledgeBase) => knowledgeBase.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledgeBaseId' })
  knowledgeBase: KnowledgeBase;

  @OneToMany(() => Chunk, (chunk) => chunk.document)
  chunks: Chunk[];
}
