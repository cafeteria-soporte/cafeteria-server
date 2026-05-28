import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DssFilterDto } from '../dto/dss-filter.dto';
import { TabPrincipalResponseDto } from '../dto/tab-principal-response.dto';

@Injectable()
export class TabPrincipalService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async get(filter: DssFilterDto): Promise<TabPrincipalResponseDto> {
    // 1. Turno abierto
    const [shift] = await this.ds.query<
      Array<{
        shift_record_id: number;
        cashier_name: string;
        hours_active: number;
      }>
    >(
      `SELECT sr.shift_record_id,
              u.full_name AS cashier_name,
              EXTRACT(EPOCH FROM (NOW() - sr.opened_at)) / 3600.0 AS hours_active
       FROM shift_records sr
       JOIN users u ON u.user_id = sr.cashier_id
       WHERE sr.status = 'open'
       LIMIT 1`,
    );

    let cashAccumulationBs = 0;
    let fatigueRiskScore = 0;

    if (shift) {
      // 2. Efectivo acumulado en el turno activo
      const [cashRow] = await this.ds.query<Array<{ cash_bs: string }>>(
        `SELECT COALESCE(SUM(op.amount), 0) AS cash_bs
         FROM order_payments op
         JOIN user_orders uo ON uo.user_order_id = op.user_order_id
         JOIN payment_methods pm ON pm.payment_method_id = op.payment_method_id
         WHERE uo.shift_record_id = $1
           AND uo.status = 'paid'
           AND pm.name = 'cash'`,
        [shift.shift_record_id],
      );
      cashAccumulationBs = Number(cashRow.cash_bs);

      // 3. Pagos cash consecutivos (últimas 10 órdenes del turno)
      const [consRow] = await this.ds.query<Array<{ consecutive_cash: string }>>(
        `SELECT COUNT(*) AS consecutive_cash
         FROM (
           SELECT uo.user_order_id
           FROM user_orders uo
           WHERE uo.shift_record_id = $1
             AND uo.status = 'paid'
             AND NOT EXISTS (
               SELECT 1
               FROM order_payments op2
               JOIN payment_methods pm2 ON pm2.payment_method_id = op2.payment_method_id
               WHERE op2.user_order_id = uo.user_order_id
                 AND pm2.name != 'cash'
             )
           ORDER BY uo.created_at DESC
           LIMIT 10
         ) sub`,
        [shift.shift_record_id],
      );
      const consecutiveCash = Number(consRow.consecutive_cash);

      // 4. Score de fatiga: horas activas × 8 + cash consecutivos × 3 (máx 100)
      const hoursActive = Number(shift.hours_active);
      const threshold = filter.crisisMode ? 60 : 80;
      fatigueRiskScore = Math.min(100, Math.round(hoursActive * 8 + consecutiveCash * 3));
      // Si el score calculado supera el umbral del modo, lo empuja a 100
      if (fatigueRiskScore >= threshold) fatigueRiskScore = Math.min(100, fatigueRiskScore);
    }

    // 5. Costo de oportunidad: productos actualmente en stock 0
    const [oppRow] = await this.ds.query<Array<{ opportunity_cost_bs: string }>>(
      `WITH current_zero AS (
         SELECT p.product_id, p.sale_price
         FROM products p
         WHERE p.current_stock <= 0 AND p.active = true
       ),
       last_zero_event AS (
         SELECT DISTINCT ON (sm.product_id)
           sm.product_id,
           sm.created_at AS zero_since
         FROM stock_movements sm
         JOIN current_zero cz ON cz.product_id = sm.product_id
         WHERE sm.stock_after <= 0
         ORDER BY sm.product_id, sm.created_at DESC
       ),
       sales_rates AS (
         SELECT
           oi.product_id,
           GREATEST(0,
             SUM(oi.quantity)::float /
             NULLIF(EXTRACT(EPOCH FROM (MAX(uo.created_at) - MIN(uo.created_at))) / 3600.0, 0)
           ) AS units_per_hour
         FROM order_items oi
         JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
         WHERE uo.status = 'paid'
           AND uo.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY oi.product_id
       )
       SELECT COALESCE(ROUND(SUM(
         EXTRACT(EPOCH FROM (NOW() - lze.zero_since)) / 3600.0
         * COALESCE(sr.units_per_hour, 0)
         * cz.sale_price
       )::numeric, 2), 0) AS opportunity_cost_bs
       FROM current_zero cz
       JOIN last_zero_event lze ON lze.product_id = cz.product_id
       LEFT JOIN sales_rates sr ON sr.product_id = cz.product_id`,
    );
    const opportunityCostBs = Number(oppRow.opportunity_cost_bs);

    // 6. Ranking de eficiencia de cajeros
    const { dateWhere, params } = this.buildDateWhere(filter.startDate, filter.endDate);
    const efficiencyRows = await this.ds.query<
      Array<{ cashier_name: string; efficiency_score: number }>
    >(
      `SELECT
         u.full_name AS cashier_name,
         GREATEST(0, 100 - ROUND(
           CASE
             WHEN COALESCE(SUM(uo.total), 0) = 0 THEN 0
             ELSE COALESCE(SUM(ABS(sr.discrepancy)), 0) / NULLIF(SUM(uo.total), 0) * 1000
           END
         )) AS efficiency_score
       FROM users u
       LEFT JOIN shift_records sr
         ON sr.cashier_id = u.user_id AND sr.status = 'closed' ${dateWhere}
       LEFT JOIN user_orders uo
         ON uo.shift_record_id = sr.shift_record_id AND uo.status = 'paid'
       WHERE u.role_id = 3 AND u.active = true
       GROUP BY u.user_id, u.full_name
       ORDER BY efficiency_score DESC`,
      params,
    );

    return {
      shiftStatus: {
        isOpen: !!shift,
        cashierName: shift?.cashier_name ?? null,
        cashAccumulationBs,
        fatigueRiskScore,
      },
      holisticKpis: {
        opportunityCostBs,
        cashierEfficiencyRanking: efficiencyRows.map((r) => ({
          cashierName: r.cashier_name,
          efficiencyScore: Number(r.efficiency_score),
        })),
      },
    };
  }

  private buildDateWhere(
    startDate?: string,
    endDate?: string,
  ): { dateWhere: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (startDate) {
      params.push(startDate);
      conditions.push(`sr.opened_at >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`sr.opened_at < ($${params.length}::date + interval '1 day')`);
    }
    return {
      dateWhere: conditions.length ? `AND ${conditions.join(' AND ')}` : '',
      params,
    };
  }
}
