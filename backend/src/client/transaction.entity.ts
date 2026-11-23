import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  msb_id: string;

  @Column({ type: 'uuid', nullable: true })
  account_id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @Column({ type: 'text', unique: true })
  transaction_number: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  category: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'text', default: 'USD' })
  currency: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @Column({ type: 'boolean', default: false })
  requires_approval: boolean;

  @Column({ type: 'uuid', nullable: true })
  from_account_id: string;

  @Column({ type: 'uuid', nullable: true })
  to_account_id: string;

  @Column({ type: 'uuid', nullable: true })
  beneficiary_id: string;

  @Column({ type: 'text', nullable: true })
  payment_method: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  merchant: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  balance_after: string;

  @Column({ type: 'int', default: 0 })
  risk_score: number;

  @Column({ type: 'text', array: true, default: '{}' })
  flags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'account_id' })
  main_account: Account;
} 