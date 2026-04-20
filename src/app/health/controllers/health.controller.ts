import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckService,
    TypeOrmHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/app/auth/decorators';
@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly db: TypeOrmHealthIndicator,
        private readonly memory: MemoryHealthIndicator,
        private readonly disk: DiskHealthIndicator,
    ) { }

    @Public()
    @Get()
    @HealthCheck()
    @ApiOperation({
        summary: 'Estado de la aplicación',
        description: 'Verifica la conectividad con la base de datos, uso de memoria y espacio en disco.',
    })
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
            () => this.disk.checkStorage('disk', {
                path: '/',
                thresholdPercent: 0.9,
            }),
        ]);
    }
}
