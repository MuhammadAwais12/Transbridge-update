import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TransferRecordType = 'on-ramp' | 'off-ramp';

@Entity('user_transfers')
export class UserTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'text' })
  type: TransferRecordType;

  @Column({ type: 'text' })
  transfer_id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updated_at: Date;
}
