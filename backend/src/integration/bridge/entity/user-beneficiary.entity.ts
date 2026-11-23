import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_beneficiaries')
export class UserBeneficiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'text' })
  external_account_id: string;
}
