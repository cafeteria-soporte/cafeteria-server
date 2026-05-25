import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseCreatedUpdated } from 'src/database/entities/base.entity';
import { User } from 'src/modules/user-management/users/entities/user.entity';
import { ShiftRecord } from '../../shift-records/entities/shift-record.entity';
import { OrderItem } from '../../order-items/entities/order-item.entity';
import { OrderPayment } from '../../order-payments/entities/order-payment.entity';

@Entity('user_orders')
export class UserOrder extends BaseCreatedUpdated {
  @PrimaryGeneratedColumn({ name: 'user_order_id', type: 'int' })
  id: number;

  @Column({ name: 'shift_record_id', type: 'int' })
  shiftRecordId: number;

  @Column({ name: 'cashier_id', type: 'int' })
  cashierId: number;

  @Column({ name: 'voided_by', type: 'int', nullable: true })
  voidedBy: number | null;

  @Column({
    name: 'receipt_number',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  receiptNumber: string | null;

  @Column({ name: 'total', type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'open' })
  status: string;

  @Column({ name: 'void_reason', type: 'text', nullable: true })
  voidReason: string | null;

  @ManyToOne(() => ShiftRecord, (s) => s.orders)
  @JoinColumn({ name: 'shift_record_id' })
  shiftRecord?: ShiftRecord;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashier_id' })
  cashier?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'voided_by' })
  voidedByUser?: User;

  @OneToMany(() => OrderItem, (i) => i.userOrder)
  items?: OrderItem[];

  @OneToMany(() => OrderPayment, (p) => p.userOrder)
  payments?: OrderPayment[];
}
