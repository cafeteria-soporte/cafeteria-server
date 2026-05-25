import { Controller, Get, Query, Res } from '@nestjs/common';
import { InventoryAnalyticsService } from '../services/inventory-analytics.service';
import { InventoryFilterDto } from '../dto/in/inventory-filter.dto';
import { AdministratorUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import { AuditAction, AuditModule } from 'src/modules/system-config/audit-log/enums';
const PDFDocument = require('pdfkit');

@Controller('analytics/inventory')
export class InventoryAnalyticsController {
  constructor(
    private readonly service: InventoryAnalyticsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('movements')
  @AdministratorUp()
  async getMovements(
    @Query() query: InventoryFilterDto,
    @CurrentUser() user: any,
  ) {
    await this.auditLog.create({
      action: AuditAction.REPORT_QUERIED,
      module: AuditModule.ANALYTICS,
      userId: user.id,
      usernameSnapshot: user.username,
      newValue: 'Consultó historial de movimientos',
    });
    return { data: await this.service.getMovements(query) };
  }

  @Get('shrinkage')
  @AdministratorUp()
  async getShrinkage() {
    return { data: await this.service.getShrinkage() };
  }

  @Get('stock-velocity')
  @AdministratorUp()
  async getStockVelocity() {
    return { data: await this.service.getStockVelocity() };
  }

  @Get('movements/export')
  @AdministratorUp()
  async export(
    @Query() query: InventoryFilterDto,
    @Res() res: any,
    @CurrentUser() user: any,
  ) {
    const { format } = query;
    const data = await this.service.getMovements(query);

    await this.auditLog.create({
      action: AuditAction.REPORT_QUERIED,
      module: AuditModule.ANALYTICS,
      userId: user.id,
      usernameSnapshot: user.username,
      newValue: `Exportó reporte de inventario en ${format}`,
    });

    // --- LÓGICA CSV ---
    if (format === 'csv') {
      const headers = [
        'ID,Fecha,Producto,Tipo,Cantidad,Stock_Resultante,Motivo,Usuario',
      ];
      const rows = data.map(
        (m) =>
          `${m.id},${m.createdAt},${m.productName},${m.movementType},${m.quantity},${m.resultingStock},"${m.reason || ''}",${m.registeredBy}`,
      );
      const csv = headers.concat(rows).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.attachment(`reporte-inventario-${Date.now()}.csv`);
      return res.status(200).send(csv);
    }

    // --- LÓGICA PDF ---
    if (format === 'pdf') {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const filename = `reporte-inventario-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${filename}`,
        );

        doc.pipe(res);

        // 1. Encabezado
        doc
          .fontSize(18)
          .text('CAFETERÍA - REPORTE DE INVENTARIO', { align: 'center' });
        doc.moveDown(0.2);
        doc
          .fontSize(10)
          .fillColor('black')
          .text(`Generado por: ${user.username}`, { align: 'right' });
        doc.text(`Fecha: ${new Date().toLocaleString()}`, { align: 'right' });

        // 2. Línea separadora dinámica (usamos doc.y para que siempre esté debajo del texto)
        const lineY = doc.y + 10;
        doc.moveTo(30, lineY).lineTo(565, lineY).stroke();

        // 3. Espacio extra después de la línea
        doc.moveDown(3);

        // 4. Contenido
        if (!data || data.length === 0) {
          doc
            .fontSize(12)
            .fillColor('red')
            .text('No se encontraron movimientos en este rango de fechas.', {
              align: 'center',
            });
        } else {
          data.forEach((m, index) => {
            doc
              .fontSize(11)
              .fillColor('#2c3e50')
              .text(`${index + 1}. ${m.productName || 'Producto sin nombre'}`);
            doc
              .fontSize(9)
              .fillColor('#7f8c8d')
              .text(
                `Fecha: ${m.createdAt} | Tipo: ${m.movementType} | Cant: ${m.quantity} | Stock: ${m.resultingStock}`,
              );
            doc.text(`Motivo: ${m.reason || 'N/A'}`);
            doc.moveDown(0.8);
          });
        }

        doc.end();
      } catch (err) {
        console.error('Error generando PDF:', err);
        return res
          .status(500)
          .json({ message: 'Error al generar el documento PDF.' });
      }
      return;
    }
  }
}
