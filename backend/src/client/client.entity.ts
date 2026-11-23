import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class ClientUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  msb_id: string;

  @Column({ unique: true, length: 254 })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  role: string; // 'account_holder'

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  last_login: Date;

  @Column({ nullable: true, length: 255 })
  password_hash: string;

  @Column({ default: false })
  twofa_enabled: boolean;

  @Column({ nullable: true, length: 64 })
  twofa_secret: string;

  @Column('varchar', { array: true, nullable: true })
  twofa_backup_codes: string[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ default: false })
  password_changed: boolean;
}

@Entity('clients')
export class ClientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  msb_id: string;

  @Column({ nullable: true, length: 100 })
  blindpay_receiver_id: string;

  @Column({ default: 'individual', length: 20 })
  client_type: 'individual' | 'business';

  @Column({ nullable: true, default: false })
  is_msb?: boolean;

  @Column({ nullable: true, default: '0.00' })
  developer_fee_percent?: string;

  @Column({ nullable: true, length: 200 })
  legal_name: string;

  @Column({ nullable: true, length: 200 })
  doing_business_as: string;

  @Column({ type: 'date', nullable: true })
  formation_date: Date;

  @Column({ nullable: true, length: 255 })
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  ubos: any;

  @Column({ type: 'jsonb', nullable: true })
  shareholders: any;

  @Column({ nullable: true, length: 45 })
  ip_address: string;

  @Column({ nullable: true, length: 255 })
  address_1: string;

  @Column({ nullable: true, length: 255 })
  address_2: string;

  @Column({ nullable: true, length: 100 })
  city: string;

  @Column({ nullable: true, length: 100 })
  state: string;

  @Column({ nullable: true, length: 20 })
  postal_code: string;

  @Column({ nullable: true, length: 100 })
  id_document_country: string;

  @Column({ nullable: true, length: 100 })
  id_document_type: string;

  @Column({ nullable: true, length: 500 })
  id_document_front: string;

  @Column({ nullable: true, length: 500 })
  id_document_back: string;

  @Column({ nullable: true, length: 100 })
  proof_of_address_type: string;

  @Column({ nullable: true, length: 500 })
  proof_of_address_document: string;

  @Column({ nullable: true, length: 500 })
  company_formation_document: string;

  @Column({ nullable: true, length: 500 })
  proof_of_ownership_document: string;

  @Column({ nullable: true, length: 100 })
  kyc_type: string;

  @Column({ type: 'jsonb', nullable: true })
  kyc_warnings: any;

  // Existing fields
  @Column({ length: 50 })
  first_name: string;

  @Column({ length: 50 })
  last_name: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ nullable: true, length: 100 })
  nationality: string;

  @Column({ nullable: true, length: 100 })
  country: string;

  @Column({ nullable: true, length: 20 })
  phone_number: string;

  @Column({ nullable: true, length: 100 })
  id_type: string;

  @Column({ nullable: true, length: 100 })
  id_number: string;

  @Column({ nullable: true, length: 100 })
  occupation: string;

  @Column({ nullable: true, length: 100 })
  source_of_funds: string;

  @Column({ nullable: true, length: 100 })
  annual_income_range: string;

  @Column({ type: 'jsonb', default: '{}' })
  address: any;

  @Column({ default: 'pending', length: 20 })
  kyc_status: string;

  @Column({ default: 'low', length: 20 })
  risk_level: string;

  @Column({ type: 'timestamp', nullable: true })
  kyc_completed_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Wallet fields added by migration
  @Column({ nullable: true, length: 42 })
  wallet_address: string;

  @Column({ nullable: true, length: 50 })
  wallet_network: string;

  @Column({ type: 'timestamp', nullable: true })
  wallet_connected_at: Date;

  @Column({ nullable: true, length: 100 })
  blindpay_wallet_id: string;
}
