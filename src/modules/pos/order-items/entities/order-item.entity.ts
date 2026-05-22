import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserOrder } from '../../user-orders/entities/user-order.entity';
import { Product } from 'src/modules/product-catalog/products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryColumn({ name: 'user_order_id', type: 'int' })
  userOrderId: number;

  @PrimaryColumn({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ name: 'quantity', type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ManyToOne(() => UserOrder, (o) => o.items)
  @JoinColumn({ name: 'user_order_id' })
  userOrder?: UserOrder;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;
}
