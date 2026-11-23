import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('fee_accounts')
export class FeeExternalAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  msb_id: string;

  @Column({ type: 'text' })
  bank_name: string;

  @Column({
    type: 'enum',
    enum: ['individual', 'business'],
    default: 'individual',
  })
  account_owner_type: 'individual' | 'business';

  @Column({ type: 'text', nullable: true })
  first_name: string;

  @Column({ type: 'text', nullable: true })
  last_name: string;

  @Column({ type: 'text', nullable: true })
  business_name: string;

  @Column({ type: 'text' })
  routing_number: string;

  @Column({ type: 'text' })
  account_number: string;

  @Column({ type: 'enum', enum: ['checking', 'savings'], default: 'checking' })
  account_type: 'checking' | 'savings';

  @Column({ type: 'text' })
  street_line_1: string;

  @Column({ type: 'text', nullable: true })
  street_line_2: string;

  @Column({ type: 'text' })
  country: string;

  @Column({ type: 'text' })
  city: string;

  @Column({ type: 'text', nullable: true })
  state: string;

  @Column({ type: 'text' })
  postal_code: string;
}
