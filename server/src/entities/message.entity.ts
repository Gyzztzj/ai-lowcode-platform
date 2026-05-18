import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MessageRole } from './message-role.enum';
import { Conversation } from './conversation.entity';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Column()
  content: string;

  @Column({ default: false })
  favorite: boolean;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  relevanceScore: number | null;

  @Column({ type: 'int', nullable: true })
  latencyMs: number | null;

  @Column()
  conversationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}
