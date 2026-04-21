import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn({ name: 'payment_method_id', type: 'int' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 50, unique: true })
  name: string;
}
