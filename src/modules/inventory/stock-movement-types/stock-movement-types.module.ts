import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovementType } from './entities/stock-movement-type.entity';
import { StockMovementTypesService } from './services/stock-movement-types.service';
import { StockMovementTypesController } from './controllers/stock-movement-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovementType])],
  controllers: [StockMovementTypesController],
  providers: [StockMovementTypesService],
  exports: [StockMovementTypesService],
})
export class StockMovementTypesModule {}
