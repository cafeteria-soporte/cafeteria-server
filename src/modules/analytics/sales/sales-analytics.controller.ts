import { Controller, Get, Query, StreamableFile, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdministratorUp } from 'src/app/auth/decorators';
import { SalesAnalyticsService } from './sales-analytics.service';
import { SalesExportFilterDto, SalesFilterDto } from './dto/in/sales-filter.dto';
import { SalesByPeriodDto } from './dto/out/sales-by-period.dto';
import { TopProductDto } from './dto/out/top-product.dto';
import { SalesByCategoryDto } from './dto/out/sales-by-category.dto';
import { AnalyticsAuditInterceptor } from '../interceptors/analytics-audit.interceptor';

@ApiTags('Analytics - Ventas')
@Controller('analytics/sales')
@AdministratorUp()
@UseInterceptors(AnalyticsAuditInterceptor)
export class SalesAnalyticsController {
    constructor(private readonly service: SalesAnalyticsService) {}

    @Get('by-period')
    @ApiOperation({
        summary: 'Ventas agrupadas por período (Admin+)',
        description: 'Agrupa las ventas pagadas por día, semana o mes según el parámetro groupBy.',
    })
    @ApiOkResponse({ type: SalesByPeriodDto, isArray: true })
    findByPeriod(@Query() filter: SalesFilterDto): Promise<SalesByPeriodDto[]> {
        return this.service.findByPeriod(filter);
    }

    @Get('by-category')
    @ApiOperation({
        summary: 'Ventas agrupadas por categoría (Admin+)',
        description: 'Ingresos, número de órdenes y porcentaje por cada categoría de producto.',
    })
    @ApiOkResponse({ type: SalesByCategoryDto, isArray: true })
    findByCategory(@Query() filter: SalesFilterDto): Promise<SalesByCategoryDto[]> {
        return this.service.findByCategory(filter);
    }

    @Get('top-products')
    @ApiOperation({
        summary: 'Top productos por ingresos (Admin+)',
        description: 'Ranking de productos ordenados por ingresos totales. Usa ?limit para controlar cuántos devuelve.',
    })
    @ApiOkResponse({ type: TopProductDto, isArray: true })
    findTopProducts(@Query() filter: SalesFilterDto): Promise<TopProductDto[]> {
        return this.service.findTopProducts(filter);
    }

    @Get('export')
    @ApiOperation({
        summary: 'Exportar reporte de ventas (Admin+)',
        description: 'Descarga el reporte completo de ventas en PDF o CSV. Usa ?format=pdf o ?format=csv.',
    })
    exportReport(@Query() filter: SalesExportFilterDto): Promise<StreamableFile> {
        return this.service.exportReport(filter);
    }
}
