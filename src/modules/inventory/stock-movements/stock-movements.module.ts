import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementsService } from './services/stock-movements.service';
import { StockMovementsController } from './controllers/stock-movements.controller';
import { ProductsModule } from 'src/modules/product-catalog/products/products.module';

@Module({
    imports: [TypeOrmModule.forFeature([StockMovement]), ProductsModule],
    controllers: [StockMovementsController],
    providers: [StockMovementsService],
    exports: [StockMovementsService],
})
export class StockMovementsModule {}
