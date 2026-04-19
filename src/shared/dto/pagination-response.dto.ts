import { ApiProperty } from '@nestjs/swagger';

class MetadataDto {
    @ApiProperty({ description: 'Número de la página actual', example: 1 })
    page: number;

    @ApiProperty({ description: 'Cantidad de elementos por página', example: 10 })
    limit: number;

    @ApiProperty({ description: 'Cantidad total de páginas disponibles', example: 5 })
    pages: number;

    @ApiProperty({ description: 'Cantidad total de registros encontrados', example: 42 })
    total: number;
}

export class PaginationResponseDto<T> {
    @ApiProperty({ description: 'Array de elementos de la página actual', type: Object, isArray: true })
    data: T[];

    @ApiProperty({ description: 'Metadata de la consulta', type: MetadataDto })
    meta: MetadataDto;
}
