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
    let cashAccumulationHistory: Array<{ hour: string; amountBs: number }> = [];

    if (shift) {
      // 2. Efectivo acumulado total + historial por hora
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

      // 3. Historial acumulado por hora (initial_fund + pagos cash acumulados)
      const historyRows = await this.ds.query<Array<{ hour: string; amount_bs: string }>>(
        `WITH hourly AS (
           SELECT
             DATE_TRUNC('hour', uo.created_at)  AS hour_ts,
             SUM(op.amount)                      AS hour_cash
           FROM order_payments op
           JOIN user_orders uo ON uo.user_order_id = op.user_order_id
           JOIN payment_methods pm ON pm.payment_method_id = op.payment_method_id
           WHERE uo.shift_record_id = $1
             AND uo.status = 'paid'
             AND pm.name = 'cash'
           GROUP BY hour_ts
         )
         SELECT
           TO_CHAR(hour_ts, 'HH24:MI') AS hour,
           (SELECT sr.initial_fund FROM shift_records sr WHERE sr.shift_record_id = $1)
           + SUM(hour_cash) OVER (ORDER BY hour_ts) AS amount_bs
         FROM hourly
         ORDER BY hour_ts`,
        [shift.shift_record_id],
      );
      cashAccumulationHistory = historyRows.map((r) => ({
        hour: r.hour,
        amountBs: Number(r.amount_bs),
      }));

      // 4. Pagos cash consecutivos (últimas 10 órdenes del turno)
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

      // 5. Score de fatiga: horas activas × 8 + cash consecutivos × 3 (máx 100)
      const threshold = filter.crisisMode ? 60 : 80;
      fatigueRiskScore = Math.min(100, Math.round(Number(shift.hours_active) * 8 + consecutiveCash * 3));
      if (fatigueRiskScore >= threshold) fatigueRiskScore = Math.min(100, fatigueRiskScore);
    }

    // 6. Costo de oportunidad: productos actualmente en stock 0
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

    // 7. Ranking de eficiencia con desglose por dimensión
    const { dateWhere, params } = this.buildDateWhere(filter.startDate, filter.endDate);
    const efficiencyRows = await this.ds.query<
      Array<{
        cashier_name: string;
        efficiency_score: number;
        sales_score: number;
        accuracy_score: number;
        speed_score: number;
        cash_handling_score: number;
        attendance_score: number;
      }>
    >(
      `WITH base AS (
         SELECT
           u.user_id,
           u.full_name                                                              AS cashier_name,
           COALESCE(SUM(uo.total), 0)                                              AS total_revenue,
           COALESCE(SUM(ABS(sr.discrepancy)), 0)                                   AS total_discrepancy,
           COUNT(DISTINCT uo.user_order_id)                                        AS total_orders,
           COALESCE(SUM(
             EXTRACT(EPOCH FROM (sr.closed_at - sr.opened_at)) / 3600.0
           ), 0)                                                                    AS total_hours,
           COUNT(DISTINCT sr.shift_record_id)                                      AS total_shifts,
           COUNT(DISTINCT CASE WHEN sr.discrepancy_alert = false
                               THEN sr.shift_record_id END)                        AS clean_shifts
         FROM users u
         LEFT JOIN shift_records sr
           ON sr.cashier_id = u.user_id AND sr.status = 'closed' ${dateWhere}
         LEFT JOIN user_orders uo
           ON uo.shift_record_id = sr.shift_record_id AND uo.status = 'paid'
         WHERE u.role_id = 3 AND u.active = true
         GROUP BY u.user_id, u.full_name
       ),
       normalized AS (
         SELECT *,
           MAX(total_revenue)                                                     OVER () AS max_revenue,
           MAX(CASE WHEN total_hours > 0
                    THEN total_orders::float / total_hours ELSE 0 END)           OVER () AS max_speed,
           AVG(total_shifts::float)                                              OVER () AS avg_shifts
         FROM base
       )
       SELECT
         cashier_name,
         GREATEST(0, 100 - ROUND(
           CASE WHEN total_revenue = 0 THEN 0
                ELSE total_discrepancy / NULLIF(total_revenue, 0) * 1000 END
         ))::int                                                                  AS efficiency_score,
         CASE WHEN max_revenue > 0
           THEN LEAST(100, ROUND(total_revenue / max_revenue * 100))::int
           ELSE 0 END                                                             AS sales_score,
         GREATEST(0, 100 - ROUND(
           CASE WHEN total_revenue = 0 THEN 0
                ELSE total_discrepancy / NULLIF(total_revenue, 0) * 1000 END
         ))::int                                                                  AS accuracy_score,
         CASE WHEN total_hours > 0 AND max_speed > 0
           THEN LEAST(100, ROUND(
                  (total_orders::float / total_hours) / max_speed * 100
                ))::int
           ELSE 0 END                                                             AS speed_score,
         CASE WHEN total_shifts > 0
           THEN ROUND(clean_shifts::float / total_shifts * 100)::int
           ELSE 100 END                                                           AS cash_handling_score,
         CASE WHEN avg_shifts > 0
           THEN LEAST(100, ROUND(total_shifts::float / avg_shifts * 100))::int
           ELSE 100 END                                                           AS attendance_score
       FROM normalized
       ORDER BY efficiency_score DESC`,
      params,
    );

    return {
      shiftStatus: {
        isOpen: !!shift,
        cashierName: shift?.cashier_name ?? null,
        cashAccumulationBs,
        fatigueRiskScore,
        cashAccumulationHistory,
      },
      holisticKpis: {
        opportunityCostBs,
        cashierEfficiencyRanking: efficiencyRows.map((r) => ({
          cashierName: r.cashier_name,
          efficiencyScore: Number(r.efficiency_score),
          breakdown: {
            salesScore: Number(r.sales_score),
            accuracyScore: Number(r.accuracy_score),
            speedScore: Number(r.speed_score),
            cashHandlingScore: Number(r.cash_handling_score),
            attendanceScore: Number(r.attendance_score),
          },
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
