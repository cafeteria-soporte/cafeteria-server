import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './app/health/health.module';
import { RolesModule } from './modules/user-management/roles/roles.module';
import { UsersModule } from './modules/user-management/users/users.module';
import { AuthModule } from './app/auth/auth.module';
import { CategoriesModule } from './modules/product-catalog/categories/categories.module';
import { ProductsModule } from './modules/product-catalog/products/products.module';
import { StockMovementTypesModule } from './modules/inventory/stock-movement-types/stock-movement-types.module';
import { StockMovementsModule } from './modules/inventory/stock-movements/stock-movements.module';
import { PaymentMethodsModule } from './modules/pos/payment-methods/payment-methods.module';
import { ShiftRecordsModule } from './modules/pos/shift-records/shift-records.module';
import { UserOrdersModule } from './modules/pos/user-orders/user-orders.module';
import { OrderItemsModule } from './modules/pos/order-items/order-items.module';
import { OrderPaymentsModule } from './modules/pos/order-payments/order-payments.module';
import { GlobalSettingsModule } from './modules/system-config/global-settings/global-settings.module';
import { AuditLogModule } from './modules/system-config/audit-log/audit-log.module';
import { SalesModule } from './app/sales/sales.module';
import { AdminModule } from './app/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
	imports: [
		AppConfigModule,
		DatabaseModule,
		HealthModule,
		RolesModule,
		UsersModule,
		AuthModule,
		CategoriesModule,
		ProductsModule,
		StockMovementTypesModule,
		StockMovementsModule,
		PaymentMethodsModule,
		ShiftRecordsModule,
		UserOrdersModule,
		OrderItemsModule,
		OrderPaymentsModule,
		GlobalSettingsModule,
		AuditLogModule,
		SalesModule,
		AdminModule,
		AnalyticsModule,
	],
})
export class AppModule { }
