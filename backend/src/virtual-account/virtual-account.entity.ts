import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ClientProfile } from '../client/client.entity';

export enum VirtualAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum PaymentRail {
  ACH = 'ach',
  DOMESTIC_WIRE = 'domestic_wire',
  INTERNATIONAL_WIRE = 'international_wire',
  RTP = 'rtp',
}

@Entity('virtual_accounts')
export class VirtualAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => ClientProfile)
  @JoinColumn({ name: 'client_id' })
  client: ClientProfile;

  @Column({ name: 'blindpay_receiver_id' })
  blindpayReceiverId: string;

  @Column({ name: 'blindpay_virtual_account_id' })
  blindpayVirtualAccountId: string;

  @Column({ name: 'account_number' })
  accountNumber: string;

  @Column({ name: 'routing_number' })
  routingNumber: string;

  @Column({ name: 'bank_name', default: 'BlindPay Bank' })
  bankName: string;

  @Column({
    name: 'payment_rail',
    type: 'enum',
    enum: PaymentRail,
    default: PaymentRail.ACH,
  })
  paymentRail: PaymentRail;

  @Column({ type: 'enum', enum: VirtualAccountStatus, default: VirtualAccountStatus.ACTIVE })
  status: VirtualAccountStatus;

  @Column({ name: 'token', default: 'USDC' })
  token: string;

  @Column({ name: 'blockchain_wallet_id', nullable: true })
  blockchainWalletId: string;

  @Column({ name: 'balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: string;

  @Column({ name: 'available_balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  availableBalance: string;

  @Column({ name: 'currency', default: 'USD' })
  currency: string;

  @Column({ name: 'account_name', nullable: true })
  accountName: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
} 