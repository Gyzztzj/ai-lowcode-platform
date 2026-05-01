import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  apiKeyId: string | null;

  @Column({ type: 'text' })
  action: string;

  @Column({ type: 'text', nullable: true })
  resourceType: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  resourceId: string | null;

  @Column({ type: 'simple-json', nullable: true })
  before: Record<string, any> | null;

  @Column({ type: 'simple-json', nullable: true })
  after: Record<string, any> | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'bigint', nullable: true })
  durationMs: number | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  sessionId: string | null;

  @Column({ type: 'text', nullable: true })
  requestId: string | null;

  @Column({ type: 'text', nullable: true })
  clientId: string | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
