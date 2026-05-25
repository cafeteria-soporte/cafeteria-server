import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseCreated } from 'src/database/entities/base.entity';
import { Product } from 'src/modules/product-catalog/products/entities/product.entity';
import { StockMovementType } from '../../stock-movement-types/entities/stock-movement-type.entity';
import { User } from 'src/modules/user-management/users/entities/user.entity';

@Entity('stock_movements')
export class StockMovement extends BaseCreated {
  @PrimaryGeneratedColumn({ name: 'movement_id', type: 'int' })
  id: number;

  @Column({ name: 'product_id', type: 'int' })
  productId: number;

  @Column({ name: 'movement_type_id', type: 'int' })
  movementTypeId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'quantity', type: 'int' })
  quantity: number;

  @Column({ name: 'stock_before', type: 'int' })
  stockBefore: number;

  @Column({ name: 'stock_after', type: 'int' })
  stockAfter: number;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string | null;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ManyToOne(() => StockMovementType, (t) => t.movements)
  @JoinColumn({ name: 'movement_type_id' })
  movementType?: StockMovementType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
