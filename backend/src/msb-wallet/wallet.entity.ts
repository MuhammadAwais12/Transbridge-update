import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { ClientProfile } from '../client/client.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  client_id: string;

  @ManyToOne(() => ClientProfile, client => client.id)
  @JoinColumn({ name: 'client_id' })
  client: ClientProfile;

  @Column()
  name: string;

  @Column()
  network: string;

  @Column({ nullable: true })
  signature_tx_hash: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'boolean', nullable: true })
  is_account_abstraction: boolean;

  @Column({ nullable: true })
  blindpay_wallet_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
} 