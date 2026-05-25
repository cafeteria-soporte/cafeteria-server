import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StreamableFile } from '@nestjs/common';
import { SalesByPeriodDto } from './dto/out/sales-by-period.dto';
import { TopProductDto } from './dto/out/top-product.dto';
import { SalesByCategoryDto } from './dto/out/sales-by-category.dto';
import {
  ExportFormat,
  GroupBy,
  SalesExportFilterDto,
  SalesFilterDto,
} from './dto/in/sales-filter.dto';

const VALID_GROUP_BY = ['day', 'week', 'month'];

@Injectable()
export class SalesAnalyticsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByPeriod(filter: SalesFilterDto): Promise<SalesByPeriodDto[]> {
    const groupBy = VALID_GROUP_BY.includes(filter.groupBy ?? '')
      ? filter.groupBy
      : GroupBy.DAY;
    const { where, params } = this.buildDateWhere(filter.from, filter.to);

    const rows = await this.dataSource.query<
      Array<{
        period: Date;
        revenue: string;
        order_count: string;
        avg_ticket: string;
      }>
    >(
      `SELECT
                date_trunc('${groupBy}', uo.created_at) AS period,
                COALESCE(SUM(uo.total), 0)              AS revenue,
                COUNT(uo.user_order_id)                 AS order_count,
                COALESCE(ROUND(SUM(uo.total) / NULLIF(COUNT(uo.user_order_id), 0), 2), 0) AS avg_ticket
             FROM user_orders uo
             ${where}
             GROUP BY date_trunc('${groupBy}', uo.created_at)
             ORDER BY period ASC`,
      params,
    );

    return rows.map((r) => ({
      period: new Date(r.period).toISOString().split('T')[0],
      revenue: Number(r.revenue),
      orderCount: Number(r.order_count),
      avgTicket: Number(r.avg_ticket),
    }));
  }

  async findTopProducts(filter: SalesFilterDto): Promise<TopProductDto[]> {
    const limit = filter.limit ?? 10;
    const { where, params } = this.buildDateWhere(filter.from, filter.to);
    params.push(limit);

    const rows = await this.dataSource.query<
      Array<{
        product_id: number;
        name: string;
        category: string;
        total_quantity: string;
        total_revenue: string;
      }>
    >(
      `SELECT
                p.product_id,
                p.name,
                c.name          AS category,
                SUM(oi.quantity)::int AS total_quantity,
                SUM(oi.subtotal)     AS total_revenue
             FROM order_items oi
             JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
             JOIN products    p  ON p.product_id    = oi.product_id
             JOIN categories  c  ON c.category_id   = p.category_id
             ${where}
             GROUP BY p.product_id, p.name, c.name
             ORDER BY total_revenue DESC
             LIMIT $${params.length}`,
      params,
    );

    return rows.map((r) => ({
      productId: Number(r.product_id),
      name: r.name,
      category: r.category,
      totalQuantity: Number(r.total_quantity),
      totalRevenue: Number(r.total_revenue),
    }));
  }

  async findByCategory(filter: SalesFilterDto): Promise<SalesByCategoryDto[]> {
    const { where, params } = this.buildDateWhere(filter.from, filter.to);

    const rows = await this.dataSource.query<
      Array<{
        category_id: number;
        name: string;
        revenue: string;
        order_count: string;
      }>
    >(
      `SELECT
                c.category_id,
                c.name,
                COALESCE(SUM(oi.subtotal), 0) AS revenue,
                COUNT(DISTINCT uo.user_order_id) AS order_count
             FROM order_items oi
             JOIN user_orders uo ON uo.user_order_id = oi.user_order_id
             JOIN products    p  ON p.product_id    = oi.product_id
             JOIN categories  c  ON c.category_id   = p.category_id
             ${where}
             GROUP BY c.category_id, c.name
             ORDER BY revenue DESC`,
      params,
    );

    const total = rows.reduce((sum, r) => sum + Number(r.revenue), 0);

    return rows.map((r) => ({
      categoryId: Number(r.category_id),
      name: r.name,
      revenue: Number(r.revenue),
      orderCount: Number(r.order_count),
      percentage:
        total > 0 ? Math.round((Number(r.revenue) / total) * 1000) / 10 : 0,
    }));
  }

  async exportReport(filter: SalesExportFilterDto): Promise<StreamableFile> {
    const [byPeriod, topProducts, byCategory] = await Promise.all([
      this.findByPeriod(filter),
      this.findTopProducts(filter),
      this.findByCategory(filter),
    ]);

    if (filter.format === ExportFormat.PDF) {
      return this.generatePdf(byPeriod, topProducts, byCategory, filter);
    }
    return this.generateCsv(byPeriod, filter);
  }

  private generateCsv(
    data: SalesByPeriodDto[],
    filter: SalesFilterDto,
  ): StreamableFile {
    const header = 'Periodo,Ingresos (Bs),Ordenes,Ticket Promedio (Bs)\n';
    const rows = data
      .map(
        (r) =>
          `${r.period},${r.revenue.toFixed(2)},${r.orderCount},${r.avgTicket.toFixed(2)}`,
      )
      .join('\n');
    const buffer = Buffer.from(header + rows, 'utf-8');
    return new StreamableFile(buffer, {
      type: 'text/csv',
      disposition: 'attachment; filename="reporte-ventas.csv"',
    });
  }

  private async generatePdf(
    byPeriod: SalesByPeriodDto[],
    topProducts: TopProductDto[],
    byCategory: SalesByCategoryDto[],
    filter: SalesFilterDto,
  ): Promise<StreamableFile> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfmake = require('pdfmake') as {
      virtualfs: { writeFileSync(name: string, data: Buffer): void };
      addFonts(fonts: Record<string, unknown>): void;
      createPdf(def: Record<string, unknown>): { getBuffer(): Promise<Buffer> };
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vfs = require('pdfmake/build/vfs_fonts') as Record<string, string>;

    Object.entries(vfs).forEach(([name, data]) => {
      pdfmake.virtualfs.writeFileSync(name, Buffer.from(data, 'base64'));
    });
    pdfmake.addFonts({
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
      },
    });

    const totalRevenue = byPeriod.reduce((s, r) => s + r.revenue, 0);
    const totalOrders = byPeriod.reduce((s, r) => s + r.orderCount, 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const periodLabel = `${filter.from ?? 'inicio'} — ${filter.to ?? 'hoy'}`;

    const docDef = {
      content: [
        { text: 'Reporte de Ventas — Cafetería', style: 'header' },
        { text: `Período: ${periodLabel}`, style: 'subheader' },

        { text: 'Resumen General', style: 'section' },
        {
          columns: [
            {
              text: `Ingresos Totales\nBs ${totalRevenue.toFixed(2)}`,
              style: 'kpi',
            },
            { text: `Órdenes Totales\n${totalOrders}`, style: 'kpi' },
            {
              text: `Ticket Promedio\nBs ${avgTicket.toFixed(2)}`,
              style: 'kpi',
            },
          ],
          margin: [0, 0, 0, 16],
        },

        { text: 'Ventas por Período', style: 'section' },
        byPeriod.length > 0
          ? {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Período', bold: true },
                    { text: 'Ingresos (Bs)', bold: true },
                    { text: 'Órdenes', bold: true },
                    { text: 'Ticket Prom. (Bs)', bold: true },
                  ],
                  ...byPeriod.map((r) => [
                    r.period,
                    r.revenue.toFixed(2),
                    String(r.orderCount),
                    r.avgTicket.toFixed(2),
                  ]),
                ],
              },
              margin: [0, 0, 0, 16],
            }
          : { text: 'Sin datos para este período.', italics: true },

        { text: 'Ventas por Categoría', style: 'section' },
        byCategory.length > 0
          ? {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Categoría', bold: true },
                    { text: 'Ingresos (Bs)', bold: true },
                    { text: 'Órdenes', bold: true },
                    { text: '% del Total', bold: true },
                  ],
                  ...byCategory.map((r) => [
                    r.name,
                    r.revenue.toFixed(2),
                    String(r.orderCount),
                    `${r.percentage.toFixed(1)}%`,
                  ]),
                ],
              },
              margin: [0, 0, 0, 16],
            }
          : { text: 'Sin datos para este período.', italics: true },

        { text: 'Top Productos', style: 'section' },
        topProducts.length > 0
          ? {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Producto', bold: true },
                    { text: 'Categoría', bold: true },
                    { text: 'Unidades Vendidas', bold: true },
                    { text: 'Ingresos (Bs)', bold: true },
                  ],
                  ...topProducts.map((r) => [
                    r.name,
                    r.category,
                    String(r.totalQuantity),
                    r.totalRevenue.toFixed(2),
                  ]),
                ],
              },
            }
          : { text: 'Sin datos para este período.', italics: true },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 4] },
        subheader: { fontSize: 11, color: '#555555', margin: [0, 0, 0, 20] },
        section: { fontSize: 13, bold: true, margin: [0, 8, 0, 6] },
        kpi: { fontSize: 11, alignment: 'center' as const },
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 },
    };

    const buffer = await pdfmake.createPdf(docDef as any).getBuffer();
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'attachment; filename="reporte-ventas.pdf"',
    });
  }

  private buildDateWhere(
    from?: string,
    to?: string,
  ): { where: string; params: unknown[] } {
    const conditions: string[] = ["uo.status = 'paid'"];
    const params: unknown[] = [];

    if (from) {
      params.push(from);
      conditions.push(`uo.created_at >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      conditions.push(
        `uo.created_at < ($${params.length}::date + interval '1 day')`,
      );
    }

    return { where: `WHERE ${conditions.join(' AND ')}`, params };
  }
}
