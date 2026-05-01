import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { App } from './app.entity';

@Entity('token_usage')
export class TokenUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  appId: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  apiKeyId: string | null;

  @Column({ type: 'bigint', default: 0 })
  promptTokens: number;

  @Column({ type: 'bigint', default: 0 })
  completionTokens: number;

  @Column({ type: 'bigint', default: 0 })
  totalTokens: number;

  @Column({ type: 'text', nullable: true })
  model: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => App, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'appId' })
  app: App | null;
}
