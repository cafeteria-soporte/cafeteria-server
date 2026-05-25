import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StockMovement } from 'src/modules/inventory/stock-movements/entities/stock-movement.entity';
import { Product } from 'src/modules/product-catalog/products/entities/product.entity';

@Injectable()
export class InventoryAnalyticsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getMovements(query: any) {
    const { startDate, endDate, productId, movementType } = query;
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.product', 'p')
      .leftJoinAndSelect('p.category', 'c')
      .leftJoinAndSelect('m.movementType', 'mt')
      .leftJoinAndSelect('m.user', 'u');

    if (startDate && endDate)
      qb.andWhere('m.createdAt BETWEEN :s AND :e', {
        s: startDate,
        e: endDate,
      });
    if (productId) qb.andWhere('m.productId = :productId', { productId });
    if (movementType) qb.andWhere('mt.name = :type', { type: movementType });

    const results = await qb.orderBy('m.createdAt', 'DESC').getMany();

    return results.map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      productId: m.productId,
      productName: m.product?.name,
      categoryName: m.product?.category?.name,
      movementType: m.movementType?.name,
      quantity: m.quantity,
      resultingStock: m.stockAfter,
      estimatedValue: Math.abs(m.quantity * Number(m.product?.salePrice || 0)),
      reason: m.reason,
      registeredBy: m.user?.username,
    }));
  }

  async getShrinkage() {
    const mermas = await this.movementRepo.find({
      where: { movementType: { name: 'shrinkage' } },
      relations: ['product'],
    });

    const totalValue = mermas.reduce(
      (acc, m) =>
        acc + Math.abs(m.quantity) * Number(m.product?.salePrice || 0),
      0,
    );

    const grouped = mermas.reduce((acc, m) => {
      const p = m.product;
      if (!acc[p.id])
        acc[p.id] = {
          productName: p.name,
          totalQuantity: 0,
          totalValue: 0,
          reasons: [],
        };
      acc[p.id].totalQuantity += Math.abs(m.quantity);
      acc[p.id].totalValue += Math.abs(m.quantity) * Number(p.salePrice);
      acc[p.id].reasons.push(m.reason);
      return acc;
    }, {});

    return Object.keys(grouped).map((id) => ({
      productId: Number(id),
      ...grouped[id],
      percentage:
        totalValue > 0
          ? Math.round((grouped[id].totalValue / totalValue) * 100)
          : 0,
      mainReason: grouped[id].reasons[0] || 'Vencimiento',
    }));
  }

  async getStockVelocity() {
    const products = await this.productRepo.find();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const sales = await this.movementRepo.find({
      where: {
        movementType: { name: 'sale' },
        createdAt: Between(monthAgo, new Date()),
      },
    });

    return products.map((p) => {
      const sold = sales
        .filter((s) => s.productId === p.id)
        .reduce((a, b) => a + Math.abs(b.quantity), 0);
      const avg = sold / 30;
      const days = avg > 0 ? Math.floor(p.currentStock / avg) : 999;

      let status: 'ok' | 'alerta' | 'critico' = 'ok';
      if (days <= 3) status = 'critico';
      else if (days <= 7) status = 'alerta';

      return {
        productId: p.id,
        productName: p.name,
        currentStock: p.currentStock,
        minStock: p.minStock,
        averageDailyUsage: parseFloat(avg.toFixed(2)),
        daysRemaining: days === 999 ? 0 : days,
        status,
      };
    });
  }
}
