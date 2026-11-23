import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'uuid' })
  msb_id: string;

  @Column({ unique: true })
  account_number: string;

  @Column() 
  account_name: string;

  @Column()
  account_type: 'current' | 'savings' | 'multi_currency' | 'business';

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  available_balance: string;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'frozen' | 'closed';

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interest_rate: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  overdraft_limit: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minimum_balance: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthly_fee: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  opened_date: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_activity: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'text', nullable: true })
  blindpay_bank_account_id: string;
} 