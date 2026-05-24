import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ShiftsFilterDto } from './dto/in/shifts-filter.dto';
import { VoidsByReasonDto } from './dto/out/voids-by-reason.dto';
import { VoidsByCashierDto } from './dto/out/voids-by-cashier.dto';
import { DiscrepancyDto } from './dto/out/discrepancy.dto';
import { ShiftSummaryDto } from './dto/out/shift-summary.dto';

@Injectable()
export class ShiftsAnalyticsService {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async findByReason(filter: ShiftsFilterDto): Promise<VoidsByReasonDto[]> {
        const { where, params } = this.buildDateWhere(filter.from, filter.to);

        const rows = await this.dataSource.query<Array<{
            reason: string;
            count: string;
            total_voided: string;
        }>>(
            `SELECT
                uo.void_reason AS reason,
                COUNT(uo.user_order_id) AS count,
                COALESCE(SUM(uo.total), 0) AS total_voided
             FROM user_orders uo
             ${where} AND uo.void_reason IS NOT NULL AND uo.void_reason != ''
             GROUP BY uo.void_reason
             ORDER BY count DESC`,
            params,
        );

        const total = rows.reduce((sum, r) => sum + Number(r.total_voided), 0);

        return rows.map(r => ({
            reason:       r.reason,
            count:        Number(r.count),
            totalVoided:  Number(r.total_voided),
            percentage:   total > 0 ? Math.round((Number(r.total_voided) / total) * 1000) / 10 : 0,
        }));
    }

    async findByCashier(filter: ShiftsFilterDto): Promise<VoidsByCashierDto[]> {
        const { where, params } = this.buildDateWhere(filter.from, filter.to);

        const rows = await this.dataSource.query<Array<{
            cashier_id: number;
            cashier_name: string;
            count: string;
            total_voided: string;
        }>>(
            `SELECT
                uo.voided_by AS cashier_id,
                u.username AS cashier_name,
                COUNT(uo.user_order_id) AS count,
                COALESCE(SUM(uo.total), 0) AS total_voided
             FROM user_orders uo
             LEFT JOIN users u ON u.user_id = uo.voided_by
             ${where} AND uo.voided_by IS NOT NULL
             GROUP BY uo.voided_by, u.username
             ORDER BY count DESC`,
            params,
        );

        return rows.map(r => ({
            cashierId:   Number(r.cashier_id),
            cashierName: r.cashier_name,
            count:       Number(r.count),
            totalVoided: Number(r.total_voided),
        }));
    }

    async findDiscrepancies(filter: ShiftsFilterDto): Promise<DiscrepancyDto[]> {
        const { where, params } = this.buildClosedAtWhere(filter.from, filter.to);

        const rows = await this.dataSource.query<Array<{
            shift_record_id: number;
            cashier_id: number;
            cashier_name: string;
            cashier_username: string;
            initial_fund: string;
            expected_amount: string;
            declared_amount: string;
            discrepancy: string;
            discrepancy_alert: boolean;
            opened_at: Date;
            closed_at: Date;
        }>>(
            `SELECT
                sr.shift_record_id,
                sr.cashier_id,
                u.full_name   AS cashier_name,
                u.username    AS cashier_username,
                sr.initial_fund,
                sr.expected_amount,
                sr.declared_amount,
                sr.discrepancy,
                sr.discrepancy_alert,
                sr.opened_at,
                sr.closed_at
             FROM shift_records sr
             LEFT JOIN users u ON u.user_id = sr.cashier_id
             ${where}
             ORDER BY sr.closed_at DESC`,
            params,
        );

        return rows.map(r => ({
            shiftRecordId:    Number(r.shift_record_id),
            cashierId:        Number(r.cashier_id),
            cashierName:      r.cashier_name,
            cashierUsername:  r.cashier_username,
            openedAt:         r.opened_at.toISOString(),
            closedAt:         r.closed_at.toISOString(),
            initialFund:      Number(r.initial_fund),
            expectedAmount:   r.expected_amount !== null ? Number(r.expected_amount) : null,
            declaredAmount:   r.declared_amount !== null ? Number(r.declared_amount) : null,
            discrepancy:      r.discrepancy !== null ? Number(r.discrepancy) : null,
            discrepancyAlert: r.discrepancy_alert,
        }));
    }

    async findSummaryById(id: number): Promise<ShiftSummaryDto> {
        const shiftRows = await this.dataSource.query<Array<{
            shift_record_id: number;
            cashier_id: number;
            cashier_name: string;
            cashier_username: string;
            initial_fund: string;
            expected_amount: string;
            declared_amount: string;
            discrepancy: string;
            discrepancy_alert: boolean;
            opened_at: Date;
            closed_at: Date;
        }>>(
            `SELECT
                sr.shift_record_id,
                sr.cashier_id,
                u.full_name   AS cashier_name,
                u.username    AS cashier_username,
                sr.initial_fund,
                sr.expected_amount,
                sr.declared_amount,
                sr.discrepancy,
                sr.discrepancy_alert,
                sr.opened_at,
                sr.closed_at
             FROM shift_records sr
             LEFT JOIN users u ON u.user_id = sr.cashier_id
             WHERE sr.shift_record_id = $1 AND sr.status = 'closed'`,
            [id],
        );

        if (shiftRows.length === 0) {
            throw new NotFoundException(`Turno ${id} no encontrado o no está cerrado`);
        }

        const s = shiftRows[0];

        const [voidRows, paymentRows, totalRow] = await Promise.all([
            this.dataSource.query<Array<{ reason: string; count: string; total_amount: string }>>(
                `SELECT
                    void_reason AS reason,
                    COUNT(*) AS count,
                    COALESCE(SUM(total), 0) AS total_amount
                 FROM user_orders
                 WHERE shift_record_id = $1
                   AND status = 'voided'
                   AND void_reason IS NOT NULL
                   AND void_reason != ''
                 GROUP BY void_reason
                 ORDER BY count DESC`,
                [id],
            ),
            this.dataSource.query<Array<{
                payment_method_id: number;
                payment_method_name: string;
                count: string;
                total_amount: string;
            }>>(
                `SELECT
                    pm.payment_method_id,
                    pm.name AS payment_method_name,
                    COUNT(op.order_payment_id) AS count,
                    COALESCE(SUM(op.amount), 0) AS total_amount
                 FROM order_payments op
                 JOIN user_orders uo ON uo.user_order_id = op.user_order_id
                 JOIN payment_methods pm ON pm.payment_method_id = op.payment_method_id
                 WHERE uo.shift_record_id = $1
                   AND uo.status = 'paid'
                 GROUP BY pm.payment_method_id, pm.name
                 ORDER BY total_amount DESC`,
                [id],
            ),
            this.dataSource.query<Array<{ total: string }>>(
                `SELECT COALESCE(SUM(op.amount), 0) AS total
                 FROM order_payments op
                 JOIN user_orders uo ON uo.user_order_id = op.user_order_id
                 WHERE uo.shift_record_id = $1 AND uo.status = 'paid'`,
                [id],
            ),
        ]);

        const totalCollected = Number(totalRow[0]?.total ?? 0);
        const totalVoidedOrders = voidRows.reduce((sum, r) => sum + Number(r.count), 0);
        const totalVoidedAmount = voidRows.reduce((sum, r) => sum + Number(r.total_amount), 0);

        return {
            shiftId:        Number(s.shift_record_id),
            cashierId:      Number(s.cashier_id),
            cashierName:    s.cashier_name,
            cashierUsername: s.cashier_username,
            openedAt:       s.opened_at.toISOString(),
            closedAt:       s.closed_at.toISOString(),
            financial: {
                initialFund:      Number(s.initial_fund),
                expectedAmount:   s.expected_amount !== null ? Number(s.expected_amount) : null,
                declaredAmount:   s.declared_amount !== null ? Number(s.declared_amount) : null,
                discrepancy:      s.discrepancy !== null ? Number(s.discrepancy) : null,
                discrepancyAlert: s.discrepancy_alert,
            },
            losses: {
                totalVoidedOrders,
                totalVoidedAmount,
                reasons: voidRows.map(r => ({
                    reason:      r.reason,
                    count:       Number(r.count),
                    totalAmount: Number(r.total_amount),
                })),
            },
            payments: {
                totalCollected,
                methods: paymentRows.map(r => ({
                    paymentMethodId:   Number(r.payment_method_id),
                    paymentMethodName: r.payment_method_name,
                    count:             Number(r.count),
                    totalAmount:       Number(r.total_amount),
                    percentage:        totalCollected > 0
                        ? Math.round((Number(r.total_amount) / totalCollected) * 1000) / 10
                        : 0,
                })),
            },
        };
    }

    private buildDateWhere(from?: string, to?: string): { where: string; params: unknown[] } {
        const conditions: string[] = ["uo.status = 'voided'"];
        const params: unknown[]    = [];

        if (from) {
            params.push(from);
            conditions.push(`uo.created_at >= $${params.length}::date`);
        }
        if (to) {
            params.push(to);
            conditions.push(`uo.created_at < ($${params.length}::date + interval '1 day')`);
        }

        return { where: `WHERE ${conditions.join(' AND ')}`, params };
    }

    private buildClosedAtWhere(from?: string, to?: string): { where: string; params: unknown[] } {
        const conditions: string[] = ["sr.status = 'closed'"];
        const params: unknown[]    = [];

        if (from) {
            params.push(from);
            conditions.push(`sr.closed_at >= $${params.length}::date`);
        }
        if (to) {
            params.push(to);
            conditions.push(`sr.closed_at < ($${params.length}::date + interval '1 day')`);
        }

        return { where: `WHERE ${conditions.join(' AND ')}`, params };
    }
}
