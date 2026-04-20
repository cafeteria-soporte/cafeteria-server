import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseCreated } from 'src/database/entities/base.entity';
import { User } from 'src/modules/user-management/users/entities/user.entity';

@Entity('audit_log')
export class AuditLog extends BaseCreated {
  @PrimaryGeneratedColumn({ name: 'log_id', type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({
    name: 'username_snapshot',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  usernameSnapshot: string | null;

  @Column({
    name: 'role_snapshot',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  roleSnapshot: string | null;

  @Column({ name: 'action', type: 'varchar', length: 100 })
  action: string;

  @Column({ name: 'module', type: 'varchar', length: 50 })
  module: string;

  @Column({
    name: 'affected_entity',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  affectedEntity: string | null;

  @Column({ name: 'entity_id', type: 'int', nullable: true })
  entityId: number | null;

  @Column({ name: 'previous_value', type: 'text', nullable: true })
  previousValue: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue: string | null;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ name: 'device', type: 'varchar', length: 200, nullable: true })
  device: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
