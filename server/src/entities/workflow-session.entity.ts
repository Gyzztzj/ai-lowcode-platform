import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('workflow_session')
export class WorkflowSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sessionId: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  appId: string;

  @Column({ type: 'simple-json' })
  state: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  variables: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  nodeOutputs: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  messages: any[];

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'text', nullable: true })
  lastNodeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}
