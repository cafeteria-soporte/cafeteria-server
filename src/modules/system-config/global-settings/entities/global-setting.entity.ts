import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user-management/users/entities/user.entity';

@Entity('global_settings')
export class GlobalSetting {
  @PrimaryColumn({ name: 'key', type: 'varchar', length: 100 })
  key: string;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedById: number | null;

  @Column({ name: 'value', type: 'text' })
  value: string;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User;
}
