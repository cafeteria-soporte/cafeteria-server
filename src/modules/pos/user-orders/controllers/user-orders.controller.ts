import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserOrdersService } from '../services/user-orders.service';

@ApiTags('User Orders')
@Controller('user-orders')
export class UserOrdersController {
    constructor(private readonly service: UserOrdersService) {}
}
