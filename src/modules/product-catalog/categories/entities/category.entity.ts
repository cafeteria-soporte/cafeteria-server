import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn({ name: 'category_id', type: 'int' })
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
    name: string;

    @Column({ name: 'active', type: 'boolean', default: true })
    active: boolean;

    @OneToMany(() => Product, (p) => p.category)
    products?: Product[];
}
