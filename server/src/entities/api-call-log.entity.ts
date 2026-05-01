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
import { ApiKey } from './api-key.entity';
import { App } from './app.entity';

export enum ApiCallStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

@Entity()
export class ApiCallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  apiKeyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  appId: string | null;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text', nullable: true })
  requestBody: string | null;

  @Column({ type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({
    type: 'enum',
    enum: ApiCallStatus,
    default: ApiCallStatus.SUCCESS,
  })
  status: ApiCallStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'bigint', default: 0 })
  responseTimeMs: number;

  @Column({ type: 'text', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ApiKey, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'apiKeyId' })
  apiKey: ApiKey | null;

  @ManyToOne(() => App, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'appId' })
  app: App | null;
}
