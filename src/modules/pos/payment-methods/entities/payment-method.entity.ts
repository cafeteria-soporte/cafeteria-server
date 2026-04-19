import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderPayment } from '../../order-payments/entities/order-payment.entity';

@Entity('payment_methods')
export class PaymentMethod {
    @PrimaryGeneratedColumn({ name: 'payment_method_id', type: 'int' })
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 50, unique: true })
    name: string;

    @OneToMany(() => OrderPayment, (p) => p.paymentMethod)
    payments?: OrderPayment[];
}
