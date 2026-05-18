import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { KnowledgeBase } from './knowledge-base.entity';
import { FlowNode, FlowEdge } from '../flow/flow.types';

@Entity('app')
export class App {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: '你是一个有用的AI助手' })
  systemPrompt: string;

  @Column({ default: 'doubao-3-5-pro' })
  defaultModel: string;

  @Column({ type: 'text', nullable: true })
  embeddingModel: string | null;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ type: 'text', nullable: true, unique: true })
  shareId: string | null;

  @Column('json', { nullable: true })
  nodes: FlowNode[] | null;

  @Column('json', { nullable: true })
  edges: FlowEdge[] | null;

  @Column()
  userId: string;

  @Column({ type: 'text', nullable: true })
  knowledgeBaseId: string | null;

  @Column({ type: 'int', nullable: true })
  dailyQuota: number | null;

  @Column({ type: 'int', nullable: true })
  monthlyQuota: number | null;

  @Column({ type: 'json', nullable: true })
  openApiSpec: object | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.apps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => KnowledgeBase, (knowledgeBase) => knowledgeBase.apps, {
    nullable: true,
  })
  @JoinColumn({ name: 'knowledgeBaseId' })
  knowledgeBase: KnowledgeBase | null;

  @OneToMany(() => Conversation, (conversation) => conversation.app)
  conversations: Conversation[];
}
