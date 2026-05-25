import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { StockMovement } from '../../stock-movements/entities/stock-movement.entity';

@Entity('stock_movement_types')
export class StockMovementType {
  @PrimaryGeneratedColumn({ name: 'movement_type_id', type: 'int' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 50, unique: true })
  name: string;

  @OneToMany(() => StockMovement, (m) => m.movementType)
  movements?: StockMovement[];
}
