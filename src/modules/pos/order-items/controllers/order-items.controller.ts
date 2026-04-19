import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderItemsService } from '../services/order-items.service';

@ApiTags('Order Items')
@Controller('order-items')
export class OrderItemsController {
    constructor(private readonly service: OrderItemsService) {}
}
