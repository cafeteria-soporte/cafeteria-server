import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DssFilterDto } from '../dto/dss-filter.dto';
import { TabPredictivoResponseDto } from '../dto/tab-predictivo-response.dto';

@Injectable()
export class TabPredictivoService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async get(filter: DssFilterDto): Promise<TabPredictivoResponseDto> {
    const [criticalStock, shrinkage, peakHour, growingCategory, stockTrend] = await Promise.all([
      this.getCriticalStock(),
      this.getExpectedShrinkage(),
      this.getPeakHour(),
      this.getGrowingCategory(),
      this.getStockTrend(),
    ]);

    return {
      inventoryPredictions: { criticalStock },
      expectedShrinkage: shrinkage,
      operationsForecast: {
        peakHourStart: peakHour?.start ?? null,
        peakHourEnd: peakHour?.end ?? null,
        growingCategory,
      },
      stockTrend,
    };
  }

  // TEA: velocidad de ventas de hoy → cuántas horas hasta agotarse
  private async getCriticalStock() {
    const rows = await this.ds.query<
      Array<{
        product_name: string;
        current_stock: number;
        tea_hours: number | null;
      }>
    >(
      `WITH today_sales AS (
         SELECT
           oi.product_id,
           SUM(oi.quantity)::float                                                           AS units_sold,
           NULLIF(EXTRACT(EPOCH FROM (NOW() - MIN(uo.created_at))) / 3600.0, 0)             AS hours_trading
         FROM order_items oi
         JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
         WHERE uo.status = 'paid'
           AND uo.created_at >= CURRENT_DATE
         GROUP BY oi.product_id
       )
       SELECT
         p.name AS product_name,
         p.current_stock,
         CASE
           WHEN ts.units_sold > 0 AND ts.hours_trading > 0
           THEN ROUND((p.current_stock / (ts.units_sold / ts.hours_trading))::numeric, 1)
           ELSE NULL
         END AS tea_hours
       FROM products p
       LEFT JOIN today_sales ts ON ts.product_id = p.product_id
       WHERE p.active = true
         AND p.current_stock <= p.min_stock * 3
       ORDER BY tea_hours ASC NULLS LAST, p.current_stock ASC`,
    );

    return rows.map((r) => ({
      productName: r.product_name,
      currentStock: Number(r.current_stock),
      teaHours: r.tea_hours !== null ? Number(r.tea_hours) : null,
    }));
  }

  // Mermas esperadas basadas en historial del mismo día de semana
  private async getExpectedShrinkage() {
    const rows = await this.ds.query<
      Array<{
        product_name: string;
        expected_loss_qty: number;
        urgency: string;
      }>
    >(
      `SELECT
         p.name AS product_name,
         ROUND(AVG(ABS(sm.quantity))) AS expected_loss_qty,
         CASE
           WHEN AVG(ABS(sm.quantity)) >= 10 THEN 'alta'
           WHEN AVG(ABS(sm.quantity)) >= 5  THEN 'media'
           ELSE 'baja'
         END AS urgency
       FROM stock_movements sm
       JOIN products p ON p.product_id = sm.product_id
       JOIN stock_movement_types smt ON smt.movement_type_id = sm.movement_type_id
       WHERE smt.name = 'shrinkage'
         AND EXTRACT(DOW FROM sm.created_at) = EXTRACT(DOW FROM NOW())
       GROUP BY p.product_id, p.name
       HAVING AVG(ABS(sm.quantity)) > 0
       ORDER BY expected_loss_qty DESC`,
    );

    return rows.map((r) => ({
      productName: r.product_name,
      expectedLossQty: Number(r.expected_loss_qty),
      urgency: r.urgency,
    }));
  }

  // Hora con más órdenes históricamente (últimos 30 días)
  private async getPeakHour(): Promise<{ start: string; end: string } | null> {
    const rows = await this.ds.query<Array<{ hour_of_day: number }>>(
      `SELECT EXTRACT(HOUR FROM created_at)::int AS hour_of_day
       FROM user_orders
       WHERE status = 'paid'
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY hour_of_day
       ORDER BY COUNT(*) DESC
       LIMIT 1`,
    );

    if (!rows.length) return null;
    const h = rows[0].hour_of_day;
    return {
      start: `${String(h).padStart(2, '0')}:00`,
      end: `${String(h + 1).padStart(2, '0')}:00`,
    };
  }

  private async getStockTrend() {
    const rows = await this.ds.query<
      Array<{
        date: string;
        day_label: string;
        avg_stock: number;
        total_shrinkage: number;
      }>
    >(
      `WITH daily AS (
         SELECT
           DATE(sm.created_at)                                                    AS day,
           p.product_id,
           MAX(sm.stock_after)                                                    AS end_stock,
           SUM(CASE WHEN smt.name = 'shrinkage' THEN ABS(sm.quantity) ELSE 0 END) AS shrinkage
         FROM stock_movements sm
         JOIN products p ON p.product_id = sm.product_id
         JOIN stock_movement_types smt ON smt.movement_type_id = sm.movement_type_id
         WHERE sm.created_at >= NOW() - INTERVAL '7 days'
           AND p.active = true
         GROUP BY DATE(sm.created_at), p.product_id
       )
       SELECT
         day::text AS date,
         CASE EXTRACT(DOW FROM day)::int
           WHEN 0 THEN 'Dom'
           WHEN 1 THEN 'Lun'
           WHEN 2 THEN 'Mar'
           WHEN 3 THEN 'Mié'
           WHEN 4 THEN 'Jue'
           WHEN 5 THEN 'Vie'
           ELSE 'Sáb'
         END AS day_label,
         ROUND(AVG(end_stock))::int AS avg_stock,
         SUM(shrinkage)::int        AS total_shrinkage
       FROM daily
       GROUP BY day
       ORDER BY day ASC`,
    );

    return rows.map((r) => ({
      date: r.date,
      dayLabel: r.day_label,
      avgStock: Number(r.avg_stock),
      totalShrinkage: Number(r.total_shrinkage),
    }));
  }

  // Categoría con mayor crecimiento esta semana vs la anterior
  private async getGrowingCategory(): Promise<string | null> {
    const rows = await this.ds.query<Array<{ category_name: string }>>(
      `WITH this_week AS (
         SELECT c.name, COALESCE(SUM(oi.subtotal), 0) AS revenue
         FROM order_items oi
         JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
         JOIN products p ON p.product_id = oi.product_id
         JOIN categories c ON c.category_id = p.category_id
         WHERE uo.status = 'paid'
           AND uo.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY c.name
       ),
       last_week AS (
         SELECT c.name, COALESCE(SUM(oi.subtotal), 0) AS revenue
         FROM order_items oi
         JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
         JOIN products p ON p.product_id = oi.product_id
         JOIN categories c ON c.category_id = p.category_id
         WHERE uo.status = 'paid'
           AND uo.created_at >= NOW() - INTERVAL '14 days'
           AND uo.created_at < NOW() - INTERVAL '7 days'
         GROUP BY c.name
       )
       SELECT tw.name AS category_name
       FROM this_week tw
       JOIN last_week lw ON lw.name = tw.name
       WHERE lw.revenue > 0
       ORDER BY (tw.revenue - lw.revenue) / lw.revenue DESC
       LIMIT 1`,
    );

    return rows.length ? rows[0].category_name : null;
  }
}
