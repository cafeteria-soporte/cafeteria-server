import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DssFilterDto } from '../dto/dss-filter.dto';
import { TabMarketingResponseDto } from '../dto/tab-marketing-response.dto';

@Injectable()
export class TabMarketingService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async get(filter: DssFilterDto): Promise<TabMarketingResponseDto> {
    const { where, params } = this.buildDateWhere(filter.startDate, filter.endDate);

    const [crossSelling, matrix, deadHours, priceSensitivity] = await Promise.all([
      this.getCrossSelling(where, params),
      this.getMenuMatrix(where, params),
      this.getDeadHours(where, params),
      this.getPriceSensitivity(),
    ]);

    return {
      crossSellingAffinity: crossSelling,
      menuPerformanceMatrix: matrix,
      heatmapInsights: { deadHours },
      priceSensitivity,
    };
  }

  // Pares de productos comprados juntos con más frecuencia
  private async getCrossSelling(where: string, params: unknown[]) {
    const rows = await this.ds.query<
      Array<{ base_product: string; matched_product: string; affinity_pct: number }>
    >(
      `WITH pairs AS (
         SELECT a.product_id AS pid_a, b.product_id AS pid_b
         FROM order_items a
         JOIN order_items b
           ON a.user_order_id = b.user_order_id AND a.product_id < b.product_id
         JOIN user_orders uo ON uo.user_order_id = a.user_order_id
         ${where}
       ),
       pair_counts AS (
         SELECT pid_a, pid_b, COUNT(*) AS co_count
         FROM pairs
         GROUP BY pid_a, pid_b
       ),
       product_totals AS (
         SELECT oi.product_id, COUNT(DISTINCT uo.user_order_id) AS total_orders
         FROM order_items oi
         JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
         ${where}
         GROUP BY oi.product_id
       )
       SELECT
         pa.name AS base_product,
         pb.name AS matched_product,
         ROUND(pc.co_count::numeric / NULLIF(pt.total_orders, 0) * 100, 1) AS affinity_pct
       FROM pair_counts pc
       JOIN products pa ON pa.product_id = pc.pid_a
       JOIN products pb ON pb.product_id = pc.pid_b
       JOIN product_totals pt ON pt.product_id = pc.pid_a
       WHERE pc.co_count >= 2
       ORDER BY affinity_pct DESC
       LIMIT 10`,
      params,
    );

    return rows.map((r) => ({
      baseProduct: r.base_product,
      matchedProduct: r.matched_product,
      affinityPct: Number(r.affinity_pct),
    }));
  }

  // Clasificación BCG simplificada por volumen vs ingresos
  private async getMenuMatrix(where: string, params: unknown[]) {
    const rows = await this.ds.query<
      Array<{
        product_name: string;
        total_revenue: number;
        matrix_type: string;
      }>
    >(
      `WITH stats AS (
         SELECT
           p.product_id,
           p.name,
           SUM(oi.quantity)::int   AS total_qty,
           SUM(oi.subtotal)        AS total_revenue
         FROM order_items oi
         JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
         JOIN products p ON p.product_id = oi.product_id
         ${where}
         GROUP BY p.product_id, p.name
       ),
       avgs AS (
         SELECT AVG(total_qty) AS avg_qty, AVG(total_revenue) AS avg_rev FROM stats
       )
       SELECT
         s.name AS product_name,
         s.total_revenue,
         CASE
           WHEN s.total_qty >= a.avg_qty AND s.total_revenue >= a.avg_rev THEN 'estrella'
           WHEN s.total_qty >= a.avg_qty AND s.total_revenue <  a.avg_rev THEN 'vaca'
           WHEN s.total_qty <  a.avg_qty AND s.total_revenue >= a.avg_rev THEN 'interrogante'
           ELSE 'zombie'
         END AS matrix_type
       FROM stats s, avgs a
       ORDER BY s.total_revenue DESC`,
      params,
    );

    return rows.map((r) => ({
      productName: r.product_name,
      matrixType: r.matrix_type,
      revenueBs: Number(r.total_revenue),
    }));
  }

  // Franjas horarias donde una categoría tiene ventas muy bajas (<30% de su promedio)
  private async getDeadHours(where: string, params: unknown[]) {
    const rows = await this.ds.query<
      Array<{ category_name: string; hour_of_day: number }>
    >(
      `WITH hourly_cat AS (
         SELECT
           c.name AS cat,
           EXTRACT(HOUR FROM uo.created_at)::int AS h,
           COUNT(DISTINCT uo.user_order_id)      AS cnt
         FROM order_items oi
         JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
         JOIN products p ON p.product_id = oi.product_id
         JOIN categories c ON c.category_id = p.category_id
         ${where}
         GROUP BY c.name, h
       ),
       cat_avg AS (
         SELECT cat, AVG(cnt) AS avg_cnt FROM hourly_cat GROUP BY cat
       )
       SELECT hc.cat AS category_name, hc.h AS hour_of_day
       FROM hourly_cat hc
       JOIN cat_avg ca ON ca.cat = hc.cat
       WHERE hc.cnt <= ca.avg_cnt * 0.3
       ORDER BY hc.h, hc.cat`,
      params,
    );

    return rows.map((r) => ({
      hourStart: `${String(r.hour_of_day).padStart(2, '0')}:00`,
      hourEnd: `${String(r.hour_of_day + 1).padStart(2, '0')}:00`,
      affectedCategory: r.category_name,
    }));
  }

  // Producto con mayor impacto de precio: ventas 7 días antes vs 7 días después del último cambio
  private async getPriceSensitivity() {
    const rows = await this.ds.query<
      Array<{
        product_name: string;
        price_change_bs: number;
        sales_drop_pct: number;
      }>
    >(
      `WITH last_changes AS (
         SELECT DISTINCT ON (al.entity_id)
           al.entity_id        AS product_id,
           al.created_at       AS changed_at,
           al.previous_value::numeric AS old_price,
           al.new_value::numeric      AS new_price
         FROM audit_log al
         WHERE al.action = 'price_changed'
           AND al.entity_id IS NOT NULL
         ORDER BY al.entity_id, al.created_at DESC
       ),
       before_sales AS (
         SELECT lc.product_id, COALESCE(SUM(oi.quantity), 0)::int AS qty
         FROM last_changes lc
         LEFT JOIN order_items oi ON oi.product_id = lc.product_id
         LEFT JOIN user_orders uo
           ON uo.user_order_id = oi.user_order_id
           AND uo.status = 'paid'
           AND uo.created_at >= lc.changed_at - INTERVAL '7 days'
           AND uo.created_at <  lc.changed_at
         GROUP BY lc.product_id
       ),
       after_sales AS (
         SELECT lc.product_id, COALESCE(SUM(oi.quantity), 0)::int AS qty
         FROM last_changes lc
         LEFT JOIN order_items oi ON oi.product_id = lc.product_id
         LEFT JOIN user_orders uo
           ON uo.user_order_id = oi.user_order_id
           AND uo.status = 'paid'
           AND uo.created_at >= lc.changed_at
           AND uo.created_at <  lc.changed_at + INTERVAL '7 days'
         GROUP BY lc.product_id
       )
       SELECT
         p.name AS product_name,
         lc.new_price - lc.old_price AS price_change_bs,
         CASE WHEN bs.qty > 0
           THEN ROUND(((bs.qty - acs.qty)::numeric / bs.qty * 100), 1)
           ELSE 0
         END AS sales_drop_pct
       FROM last_changes lc
       JOIN products p ON p.product_id = lc.product_id
       JOIN before_sales bs  ON bs.product_id  = lc.product_id
       JOIN after_sales  acs ON acs.product_id = lc.product_id
       WHERE bs.qty > 0
       ORDER BY ABS((bs.qty - acs.qty)::numeric / NULLIF(bs.qty, 0)) DESC
       LIMIT 1`,
    );

    if (!rows.length) {
      return { productName: null, salesDropPct: null, priceChangeBs: null };
    }
    const r = rows[0];
    return {
      productName: r.product_name,
      salesDropPct: Number(r.sales_drop_pct),
      priceChangeBs: Number(r.price_change_bs),
    };
  }

  private buildDateWhere(
    startDate?: string,
    endDate?: string,
  ): { where: string; params: unknown[] } {
    const conditions: string[] = ["uo.status = 'paid'"];
    const params: unknown[] = [];
    if (startDate) {
      params.push(startDate);
      conditions.push(`uo.created_at >= $${params.length}::date`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`uo.created_at < ($${params.length}::date + interval '1 day')`);
    }
    return { where: `WHERE ${conditions.join(' AND ')}`, params };
  }
}
