import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('msbs')
export class Msb {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  domain: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ default: '#3b82f6', length: 7 })
  primary_color: string;

  @Column({ default: '#22c55e', length: 7 })
  secondary_color: string;

  @Column({ default: '#f97316', length: 7 })
  accent_color: string;

  @Column({ default: 'light', length: 20 })
  theme: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  settings: any;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ length: 255, nullable: true })
  customer_id: string;

  // @OneToMany(() => User, user => user.msb)
  // users: User[];
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  msb_id: string;

  @Column({ unique: true, length: 254 })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  role: string; // 'msb_admin' or 'account_holder'

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_login: Date;

  @Column({ nullable: true, length: 255 })
  password_hash: string;

  @Column({ default: false })
  twofa_enabled: boolean;

  @Column({ nullable: true, length: 64 })
  twofa_secret: string;

  @Column('varchar', { array: true, nullable: true })
  twofa_backup_codes: string[];

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'boolean', default: false })
  password_changed: boolean;
}

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ length: 254 })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  role: string;

  @Column({ type: 'uuid', nullable: true })
  msb_id: string;

  @Column({ type: 'text' })
  activity: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;
}
