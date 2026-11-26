import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { ClientProfile } from './client.entity';

@Entity('beneficiaries')
export class Beneficiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  client_id: string;

  @ManyToOne(() => ClientProfile, client => client.id)
  @JoinColumn({ name: 'client_id' })
  client: ClientProfile;

  @Column()
  msb_id: string;

  @Column()
  name: string;

  @Column()
  account_number: string;

  @Column()
  bank_name: string;

  @Column({ nullable: true })
  bank_code: string;

  @Column()
  country: string;

  @Column()
  type: 'internal' | 'domestic' | 'international';

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_used: Date;

  @Column({ nullable: true })
  blindpay_bank_account_id: string;

  // Beneficiary type (individual or business)
  @Column({ default: 'individual' })
  beneficiary_type: 'individual' | 'business';

  // Individual-specific KYC fields
  @Column({ nullable: true })
  date_of_birth: string;

  @Column({ nullable: true })
  id_document_country: string;

  @Column({ nullable: true })
  id_document_type: string;

  @Column({ nullable: true })
  id_document_front: string;

  @Column({ nullable: true })
  id_document_back: string;

  // Business-specific fields
  @Column({ nullable: true })
  legal_name: string;

  @Column({ nullable: true })
  formation_date: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  owners: any[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
} 