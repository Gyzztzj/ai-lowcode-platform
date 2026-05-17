import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from './role.enum';
import { App } from './app.entity';
import { Conversation } from './conversation.entity';
import { KnowledgeBase } from './knowledge-base.entity';
import { ApiKey } from './api-key.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({ type: 'int', default: 1000 })
  dailyQuota: number;

  @Column({ type: 'int', default: 30000 })
  monthlyQuota: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => App, (app) => app.user)
  apps: App[];

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations: Conversation[];

  @OneToMany(() => KnowledgeBase, (knowledgeBase) => knowledgeBase.user)
  knowledgeBases: KnowledgeBase[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];
}
