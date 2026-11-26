import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reset_password')
export class ResetPassword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 254 })
  email: string;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

