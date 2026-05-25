import { BaseCreatedUpdated } from 'src/database/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User extends BaseCreatedUpdated {
  @PrimaryGeneratedColumn({
    name: 'user_id',
    type: 'int',
  })
  id: number;

  @Column({
    name: 'role_id',
    type: 'int',
    nullable: false,
  })
  roleId: number;

  @Column({
    name: 'created_by',
    type: 'int',
    nullable: true,
  })
  createdById: number | null;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 150,
    nullable: false,
  })
  fullName: string;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  username: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  email: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  passwordHash: string;

  @Column({
    name: 'failed_attempts',
    type: 'smallint',
    nullable: false,
    default: 0,
  })
  failedAttempts: number;

  @Column({
    name: 'active',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  active: boolean;

  @Column({
    name: 'requires_pwd_change',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  requiresPwdChange: boolean;

  @Column({
    name: 'locked_until',
    type: 'timestamptz',
    nullable: true,
  })
  lockedUntil: Date | null;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;
}
