import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrder } from '../../user-orders/entities/user-order.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';

@Entity('order_payments')
export class OrderPayment {
  @PrimaryGeneratedColumn({ name: 'order_payment_id', type: 'int' })
  id: number;

  @Column({ name: 'user_order_id', type: 'int' })
  userOrderId: number;

  @Column({ name: 'payment_method_id', type: 'int' })
  paymentMethodId: number;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    name: 'amount_tendered',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amountTendered: number | null;

  @ManyToOne(() => UserOrder, (o) => o.payments)
  @JoinColumn({ name: 'user_order_id' })
  userOrder?: UserOrder;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod?: PaymentMethod;
}
