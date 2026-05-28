import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdministratorUp } from 'src/app/auth/decorators';
import {
  ApiUnauthorized,
  ApiForbidden,
  ApiValidationError,
} from 'src/shared/utils/swagger/swagger-response.utils';
import { AnalyticsAuditInterceptor } from '../analytics/interceptors/analytics-audit.interceptor';
import { DssFilterDto } from './dto/dss-filter.dto';
import { TabPrincipalResponseDto } from './dto/tab-principal-response.dto';
import { TabPredictivoResponseDto } from './dto/tab-predictivo-response.dto';
import { TabMarketingResponseDto } from './dto/tab-marketing-response.dto';
import { TabPrincipalService } from './services/tab-principal.service';
import { TabPredictivoService } from './services/tab-predictivo.service';
import { TabMarketingService } from './services/tab-marketing.service';

@ApiTags('DSS - Dashboard')
@Controller('dss')
@AdministratorUp()
@UseInterceptors(AnalyticsAuditInterceptor)
export class DssController {
  constructor(
    private readonly tabPrincipalService: TabPrincipalService,
    private readonly tabPredictivoService: TabPredictivoService,
    private readonly tabMarketingService: TabMarketingService,
  ) {}

  @Get('tab-principal')
  @ApiOperation({
    summary: 'Pestaña Principal — turno activo, efectivo en riesgo, fatiga y KPIs holísticos',
    description: `
Devuelve el estado en tiempo real del turno abierto y dos KPIs holísticos que cruzan múltiples dimensiones.

**shiftStatus**
- \`isOpen\`: si hay un turno activo en este momento.
- \`cashierName\`: nombre del cajero con turno abierto.
- \`cashAccumulationBs\`: efectivo total acumulado en caja durante el turno (solo pagos en efectivo de órdenes pagadas).
- \`fatigueRiskScore\`: score 0–100 de riesgo de error humano. Sube con las horas activas y los pagos cash consecutivos. Con \`crisisMode=true\` el umbral de alerta es más bajo.

**holisticKpis**
- \`opportunityCostBs\`: Bs perdidos por productos actualmente sin stock, estimados según su tasa de venta de los últimos 30 días.
- \`cashierEfficiencyRanking\`: clasificación de cajeros (score 0–100) basada en ventas cobradas vs descuadres en arqueos. El filtro \`startDate/endDate\` restringe qué turnos se consideran.

**Nota**: \`shiftStatus\` y \`opportunityCostBs\` son siempre en tiempo real, independientemente del filtro de fechas.
    `.trim(),
  })
  @ApiOkResponse({
    type: TabPrincipalResponseDto,
    description: 'KPIs del turno activo y eficiencia de cajeros calculados exitosamente.',
  })
  @ApiUnauthorized()
  @ApiForbidden()
  @ApiValidationError()
  getTabPrincipal(@Query() filter: DssFilterDto): Promise<TabPrincipalResponseDto> {
    return this.tabPrincipalService.get(filter);
  }

  @Get('tab-predictivo')
  @ApiOperation({
    summary: 'Pestaña Predictiva — inventario crítico, mermas esperadas y pronóstico operacional',
    description: `
Predicciones basadas en datos históricos para anticipar problemas antes de que ocurran.

**inventoryPredictions.criticalStock**
- Productos con \`current_stock ≤ min_stock × 3\`.
- \`teaHours\`: Tiempo Estimado de Agotamiento en horas (stock actual ÷ tasa de ventas de hoy). \`null\` si no hubo ventas hoy.

**expectedShrinkage**
- Mermas proyectadas para hoy, calculadas como el promedio histórico de movimientos tipo "shrinkage" en el mismo día de la semana.
- \`urgency\`: "alta" (≥10 unidades), "media" (5–9), "baja" (<5).

**operationsForecast**
- \`peakHourStart / peakHourEnd\`: franja horaria con más órdenes en los últimos 30 días (formato HH:MM).
- \`growingCategory\`: categoría con mayor crecimiento porcentual esta semana vs la anterior.

**Nota**: todos los datos de este endpoint son en tiempo real o históricos globales; el filtro \`startDate/endDate\` no afecta los resultados.
    `.trim(),
  })
  @ApiOkResponse({
    type: TabPredictivoResponseDto,
    description: 'Predicciones de inventario y pronóstico operacional calculados exitosamente.',
  })
  @ApiUnauthorized()
  @ApiForbidden()
  @ApiValidationError()
  getTabPredictivo(@Query() filter: DssFilterDto): Promise<TabPredictivoResponseDto> {
    return this.tabPredictivoService.get(filter);
  }

  @Get('tab-marketing')
  @ApiOperation({
    summary: 'Pestaña Marketing — cross-selling, matriz BCG, horas muertas y sensibilidad al precio',
    description: `
Análisis estratégico de ventas para optimizar el menú y diseñar promociones.

**crossSellingAffinity**
- Top 10 pares de productos comprados juntos. Ordenados por \`affinityPct\` descendente.
- \`affinityPct\`: % de órdenes del producto base que también contienen el producto complementario.
- Solo incluye pares con al menos 2 co-ocurrencias.

**menuPerformanceMatrix**
- Clasifica cada producto en la matriz BCG simplificada comparando volumen de unidades vs ingresos respecto al promedio:
  - \`estrella\`: alto volumen + altos ingresos → producto ancla, promover.
  - \`vaca\`: alto volumen + bajos ingresos → revisar precio o rentabilidad.
  - \`interrogante\`: bajo volumen + altos ingresos → potencial desaprovechado, considerar promoción.
  - \`zombie\`: bajo volumen + bajos ingresos → evaluar retiro del menú.

**heatmapInsights.deadHours**
- Franjas de 1 hora donde una categoría tiene < 30% de su promedio histórico de órdenes.
- Ideal para diseñar "happy hours" o promociones dirigidas.

**priceSensitivity**
- Compara ventas (unidades) 7 días antes vs 7 días después del último cambio de precio registrado en el audit_log.
- \`salesDropPct\` positivo = el cliente rechazó el cambio (ventas cayeron).
- \`null\` en todos los campos si no hay cambios de precio en el historial.

El filtro \`startDate/endDate\` aplica a cross-selling, matriz BCG y horas muertas.
    `.trim(),
  })
  @ApiOkResponse({
    type: TabMarketingResponseDto,
    description: 'Análisis de marketing calculado exitosamente.',
  })
  @ApiUnauthorized()
  @ApiForbidden()
  @ApiValidationError()
  getTabMarketing(@Query() filter: DssFilterDto): Promise<TabMarketingResponseDto> {
    return this.tabMarketingService.get(filter);
  }
}
