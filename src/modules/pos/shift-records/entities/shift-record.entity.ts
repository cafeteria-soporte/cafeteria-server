import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/modules/user-management/users/entities/user.entity';
import { UserOrder } from '../../user-orders/entities/user-order.entity';

@Entity('shift_records')
export class ShiftRecord {
    @PrimaryGeneratedColumn({ name: 'shift_record_id', type: 'int' })
    id: number;

    @Column({ name: 'cashier_id', type: 'int' })
    cashierId: number;

    @Column({ name: 'initial_fund', type: 'decimal', precision: 10, scale: 2 })
    initialFund: number;

    @Column({ name: 'declared_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    declaredAmount: number | null;

    @Column({ name: 'expected_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    expectedAmount: number | null;

    @Column({ name: 'discrepancy', type: 'decimal', precision: 10, scale: 2, nullable: true })
    discrepancy: number | null;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'open' })
    status: string;

    @Column({ name: 'discrepancy_alert', type: 'boolean', default: false })
    discrepancyAlert: boolean;

    @CreateDateColumn({ name: 'opened_at', type: 'timestamptz' })
    openedAt: Date;

    @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
    closedAt: Date | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'cashier_id' })
    cashier?: User;

    @OneToMany(() => UserOrder, (o) => o.shiftRecord)
    orders?: UserOrder[];
}
