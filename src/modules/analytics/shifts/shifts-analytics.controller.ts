import { Controller, Get, Param, ParseIntPipe, Query, UseInterceptors } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdministratorUp } from 'src/app/auth/decorators';
import { AnalyticsAuditInterceptor } from '../interceptors/analytics-audit.interceptor';
import { ShiftsAnalyticsService } from './shifts-analytics.service';
import { ShiftsFilterDto } from './dto/in/shifts-filter.dto';
import { VoidsByReasonDto } from './dto/out/voids-by-reason.dto';
import { VoidsByCashierDto } from './dto/out/voids-by-cashier.dto';
import { DiscrepancyDto } from './dto/out/discrepancy.dto';
import { ShiftSummaryDto } from './dto/out/shift-summary.dto';

@ApiTags('Analytics - Turnos')
@Controller('analytics/shifts')
@AdministratorUp()
@UseInterceptors(AnalyticsAuditInterceptor)
export class ShiftsAnalyticsController {
    constructor(private readonly service: ShiftsAnalyticsService) {}

    @Get('voids')
    @ApiOperation({
        summary: 'Anulaciones agrupadas por motivo ',
        description: 'Agrupa las órdenes anuladas por motivo (void_reason), mostrando cantidad y monto total anulado.',
    })
    @ApiOkResponse({ type: VoidsByReasonDto, isArray: true })
    findByReason(@Query() filter: ShiftsFilterDto): Promise<VoidsByReasonDto[]> {
        return this.service.findByReason(filter);
    }

    @Get('voids/by-cashier')
    @ApiOperation({
        summary: 'Anulaciones agrupadas por cajero ',
        description: 'Agrupa las órdenes anuladas por el cajero que las anuló, mostrando cantidad y monto total.',
    })
    @ApiOkResponse({ type: VoidsByCashierDto, isArray: true })
    findByCashier(@Query() filter: ShiftsFilterDto): Promise<VoidsByCashierDto[]> {
        return this.service.findByCashier(filter);
    }

    @Get('discrepancies')
    @ApiOperation({
        summary: 'Historial de arqueos con discrepancias ',
        description: 'Devuelve el historial de cierres de turno mostrando diferencias entre monto esperado y declarado.',
    })
    @ApiOkResponse({ type: DiscrepancyDto, isArray: true })
    findDiscrepancies(@Query() filter: ShiftsFilterDto): Promise<DiscrepancyDto[]> {
        return this.service.findDiscrepancies(filter);
    }

    @Get(':id/summary')
    @ApiOperation({
        summary: 'Resumen analítico y financiero de un turno',
        description: 'Devuelve el desglose completo de un turno cerrado: descuadre financiero, pérdidas por anulaciones y composición de ingresos por método de pago.',
    })
    @ApiOkResponse({ type: ShiftSummaryDto })
    @ApiNotFoundResponse({ description: 'Turno no encontrado o no está cerrado' })
    findSummary(@Param('id', ParseIntPipe) id: number): Promise<ShiftSummaryDto> {
        return this.service.findSummaryById(id);
    }
}
