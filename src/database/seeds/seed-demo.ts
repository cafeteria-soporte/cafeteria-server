import 'dotenv/config';

import { AppDataSource } from '../config/data-source';

/**
 * Seed de DATOS DE DEMO para poder ver los dashboards de análisis y DSS con
 * números reales. Genera ~3 semanas de operación:
 *   - 6 categorías, 18 productos (con stock inicial vía goods_receipt)
 *   - 3 cajeros
 *   - ~15 turnos cerrados (algunos con descuadre) + 1 turno abierto hoy
 *   - ~220 órdenes pagadas con ítems y pagos (efectivo / tarjeta / mixto)
 *   - ~6 anulaciones con motivo
 *   - mermas (shrinkage) repartidas
 *   - 2 cambios de precio en audit_log (para price sensitivity del DSS)
 *
 * ⚠️ BORRA las tablas transaccionales antes de sembrar. No correr sobre una
 *    base con datos reales. Correr con:  npm run seed:demo
 */

const G = '\x1b[32m';
const Y = '\x1b[33m';
const C = '\x1b[36m';
const B = '\x1b[1m';
const R = '\x1b[0m';

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];

type Q = <T = any>(sql: string, params?: unknown[]) => Promise<T>;

const CATEGORIES = ['Bebidas Calientes', 'Bebidas Frías', 'Panadería', 'Snacks', 'Postres', 'Almuerzos'];

const PRODUCTS: Array<{ name: string; cat: string; price: number; min: number }> = [
  { name: 'Café Americano', cat: 'Bebidas Calientes', price: 8, min: 20 },
  { name: 'Capuchino', cat: 'Bebidas Calientes', price: 12, min: 20 },
  { name: 'Latte', cat: 'Bebidas Calientes', price: 14, min: 15 },
  { name: 'Té', cat: 'Bebidas Calientes', price: 6, min: 15 },
  { name: 'Chocolate Caliente', cat: 'Bebidas Calientes', price: 13, min: 10 },
  { name: 'Jugo de Naranja', cat: 'Bebidas Frías', price: 10, min: 15 },
  { name: 'Limonada', cat: 'Bebidas Frías', price: 9, min: 15 },
  { name: 'Frappé', cat: 'Bebidas Frías', price: 18, min: 10 },
  { name: 'Agua', cat: 'Bebidas Frías', price: 5, min: 30 },
  { name: 'Croissant', cat: 'Panadería', price: 7, min: 12 },
  { name: 'Medialuna', cat: 'Panadería', price: 5, min: 15 },
  { name: 'Pan de Queso', cat: 'Panadería', price: 6, min: 12 },
  { name: 'Alfajor', cat: 'Snacks', price: 8, min: 20 },
  { name: 'Papas Fritas', cat: 'Snacks', price: 10, min: 15 },
  { name: 'Cheesecake', cat: 'Postres', price: 16, min: 8 },
  { name: 'Brownie', cat: 'Postres', price: 12, min: 10 },
  { name: 'Sándwich de Pollo', cat: 'Almuerzos', price: 22, min: 8 },
  { name: 'Ensalada César', cat: 'Almuerzos', price: 20, min: 6 },
];

const VOID_REASONS = [
  'Error en el producto ingresado',
  'Cliente canceló el pedido',
  'Cobro duplicado',
  'Producto sin stock real',
];

async function seed(): Promise<void> {
  console.log(`\n${C}${B}▶  Seed de DEMO...${R}\n`);
  await AppDataSource.initialize();
  const q: Q = (sql, params) => AppDataSource.query(sql, params) as Promise<any>;

  // ── 0. Limpieza (idempotente: se puede re-correr) ─────────────────────────
  await q(`TRUNCATE order_payments, order_items, user_orders, stock_movements, shift_records RESTART IDENTITY CASCADE`);
  await q(`DELETE FROM audit_log WHERE action IN ('price_changed','stock_adjusted','shrinkage_recorded','sale_paid','sale_voided','shift_opened','shift_closed')`);
  // products no tiene UNIQUE en name → borrar los de demo (ya sin referencias
  // tras el TRUNCATE). categorías y cajeros usan ON CONFLICT más abajo.
  await q(`DELETE FROM products WHERE name = ANY($1)`, [PRODUCTS.map((p) => p.name)]);
  console.log(`  ${Y}⚠  Datos de demo previos eliminados${R}`);

  // ── 1. Cajeros ─────────────────────────────────────────────────────────────
  // hash bcrypt de "cajero123"
  const HASH = '$2b$10$0O4QUMBcXzjT.OE2zhSqxebnyGB.EBjBq2FVMxlp2usy66/rUC72K';
  const cashierNames = ['Ana López', 'Carlos Mamani', 'Rosa Quispe'];
  const cashierIds: number[] = [];
  for (let i = 0; i < cashierNames.length; i++) {
    const username = `cajero${i + 1}`;
    const [row] = await q<{ user_id: number }[]>(
      `INSERT INTO users (role_id, full_name, username, password_hash, requires_pwd_change, active)
       VALUES (3, $1, $2, $3, false, true)
       ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name, active = true
       RETURNING user_id`,
      [cashierNames[i], username, HASH],
    );
    cashierIds.push(row.user_id);
  }
  console.log(`  ${G}✔  ${cashierIds.length} cajeros${R} (cajero1..3 / cajero123)`);

  // ── 2. Categorías ──────────────────────────────────────────────────────────
  const catId: Record<string, number> = {};
  for (const name of CATEGORIES) {
    const [row] = await q<{ category_id: number }[]>(
      `INSERT INTO categories (name, active) VALUES ($1, true)
       ON CONFLICT (name) DO UPDATE SET active = true RETURNING category_id`,
      [name],
    );
    catId[name] = row.category_id;
  }

  // ── 3. Productos + stock inicial (goods_receipt) ───────────────────────────
  const rootId =
    (await q<{ user_id: number }[]>(`SELECT user_id FROM users WHERE username = 'root' LIMIT 1`))[0]
      ?.user_id ?? cashierIds[0];

  const products: Array<{ id: number; price: number; name: string }> = [];
  for (const p of PRODUCTS) {
    const [row] = await q<{ product_id: number }[]>(
      `INSERT INTO products (category_id, name, sale_price, current_stock, min_stock, active)
       VALUES ($1, $2, $3, 0, $4, true)
       RETURNING product_id`,
      [catId[p.cat], p.name, p.price, p.min],
    );
    const initial = p.min * rand(4, 8);
    await q(
      `INSERT INTO stock_movements (product_id, movement_type_id, user_id, quantity, stock_before, stock_after, reason, created_at)
       VALUES ($1, 1, $2, $3, 0, $3, 'Carga inicial de demo', NOW() - INTERVAL '22 days')`,
      [row.product_id, rootId, initial],
    );
    products.push({ id: row.product_id, price: p.price, name: p.name });
  }
  console.log(`  ${G}✔  ${products.length} productos con stock inicial${R}`);

  // ── 4. Cambios de precio (para price sensitivity del DSS) ──────────────────
  for (const target of [products[1], products[7]]) {
    const oldPrice = target.price;
    const newPrice = Math.round(oldPrice * 1.15);
    await q(
      `UPDATE products SET sale_price = $1, updated_at = NOW() - INTERVAL '10 days' WHERE product_id = $2`,
      [newPrice, target.id],
    );
    await q(
      `INSERT INTO audit_log (user_id, username_snapshot, role_snapshot, action, module, affected_entity, entity_id, previous_value, new_value, created_at)
       VALUES ($1, 'root', 'root', 'price_changed', 'products', 'products', $2, $3, $4, NOW() - INTERVAL '10 days')`,
      [rootId, target.id, String(oldPrice), String(newPrice)],
    );
    target.price = newPrice;
  }
  console.log(`  ${G}✔  2 cambios de precio${R}`);

  // ── 5. Turnos + órdenes + ítems + pagos ───────────────────────────────────
  let receiptSeq = 1;
  let totalOrders = 0;
  let totalVoids = 0;

  for (let day = 20; day >= 0; day--) {
    // 1 turno por día (a veces 2). Domingo (dow) se salta a veces.
    const shiftsToday = rand(1, 10) > 7 ? 2 : 1;
    for (let s = 0; s < shiftsToday; s++) {
      const cashierId = pick(cashierIds);
      const initialFund = pick([300, 400, 500]);
      const openHour = s === 0 ? 7 : 14;
      const openedExpr = `NOW() - INTERVAL '${day} days' + INTERVAL '${openHour} hours'`;
      const closedExpr = `NOW() - INTERVAL '${day} days' + INTERVAL '${openHour + 7} hours'`;

      const isOpenToday = day === 0 && s === shiftsToday - 1;

      const [shift] = await q<{ shift_record_id: number }[]>(
        `INSERT INTO shift_records (cashier_id, initial_fund, status, opened_at)
         VALUES ($1, $2, 'open', ${openedExpr}) RETURNING shift_record_id`,
        [cashierId, initialFund],
      );
      const shiftId = shift.shift_record_id;

      // Órdenes del turno
      const ordersInShift = rand(8, 18);
      let cashCollected = 0;

      for (let o = 0; o < ordersInShift; o++) {
        const orderHour = openHour + rand(0, 6);
        const createdExpr = `NOW() - INTERVAL '${day} days' + INTERVAL '${orderHour} hours' + INTERVAL '${rand(0, 59)} minutes'`;

        const [order] = await q<{ user_order_id: number }[]>(
          `INSERT INTO user_orders (shift_record_id, cashier_id, total, status, created_at)
           VALUES ($1, $2, 0, 'open', ${createdExpr}) RETURNING user_order_id`,
          [shiftId, cashierId],
        );
        const orderId = order.user_order_id;

        // 1-4 ítems distintos
        const nItems = rand(1, 4);
        const chosen = new Set<number>();
        let total = 0;
        for (let it = 0; it < nItems; it++) {
          const prod = pick(products);
          if (chosen.has(prod.id)) continue;
          chosen.add(prod.id);
          const qty = rand(1, 3);
          const subtotal = qty * prod.price;
          total += subtotal;
          await q(
            `INSERT INTO order_items (user_order_id, product_id, quantity, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, prod.id, qty, prod.price, subtotal],
          );
          // movimiento de venta (descuenta stock)
          const [{ current_stock }] = await q<{ current_stock: number }[]>(
            `SELECT current_stock FROM products WHERE product_id = $1`,
            [prod.id],
          );
          const after = Math.max(0, current_stock - qty);
          await q(
            `INSERT INTO stock_movements (product_id, movement_type_id, user_id, quantity, stock_before, stock_after, created_at)
             VALUES ($1, 4, $2, $3, $4, $5, ${createdExpr})`,
            [prod.id, cashierId, -(current_stock - after), current_stock, after],
          );
        }

        // ¿anulada?
        const voided = rand(1, 100) <= 3;
        if (voided) {
          await q(
            `UPDATE user_orders SET total = $1, status = 'voided', voided_by = $2,
                    void_reason = $3, receipt_number = $4, updated_at = ${createdExpr}
             WHERE user_order_id = $5`,
            [total, rootId, pick(VOID_REASONS), `VTA-${String(receiptSeq++).padStart(5, '0')}`, orderId],
          );
          totalVoids++;
          continue;
        }

        // Pago: efectivo / tarjeta / transferencia / mixto
        const mode = pick(['cash', 'cash', 'cash', 'card', 'transfer', 'mixed']);
        const receipt = `VTA-${String(receiptSeq++).padStart(5, '0')}`;
        await q(
          `UPDATE user_orders SET total = $1, status = 'paid', receipt_number = $2, updated_at = ${createdExpr}
           WHERE user_order_id = $3`,
          [total, receipt, orderId],
        );

        if (mode === 'mixed') {
          const cash = Math.round(total * 0.5);
          await q(
            `INSERT INTO order_payments (user_order_id, payment_method_id, amount, amount_tendered) VALUES ($1, 1, $2, $3)`,
            [orderId, cash, cash],
          );
          await q(
            `INSERT INTO order_payments (user_order_id, payment_method_id, amount) VALUES ($1, 2, $2)`,
            [orderId, total - cash],
          );
          cashCollected += cash;
        } else if (mode === 'cash') {
          const tendered = Math.ceil(total / 10) * 10;
          await q(
            `INSERT INTO order_payments (user_order_id, payment_method_id, amount, amount_tendered) VALUES ($1, 1, $2, $3)`,
            [orderId, total, tendered],
          );
          cashCollected += total;
        } else {
          const pmId = mode === 'card' ? 2 : 3;
          await q(
            `INSERT INTO order_payments (user_order_id, payment_method_id, amount) VALUES ($1, $2, $3)`,
            [orderId, pmId, total],
          );
        }
        totalOrders++;
      }

      // Cerrar el turno (salvo el abierto de hoy)
      if (!isOpenToday) {
        const expected = initialFund + cashCollected;
        // descuadre: mayormente 0, a veces ±
        const noise = pick([0, 0, 0, 0, rand(-80, -10), rand(10, 60), rand(-5, 5)]);
        const declared = expected + noise;
        const discrepancy = declared - expected;
        const threshold = 50;
        await q(
          `UPDATE shift_records
             SET status = 'closed', declared_amount = $1, expected_amount = $2,
                 discrepancy = $3, discrepancy_alert = $4, closed_at = ${closedExpr}
           WHERE shift_record_id = $5`,
          [declared, expected, discrepancy, Math.abs(discrepancy) > threshold, shiftId],
        );
      }
    }
  }
  console.log(`  ${G}✔  turnos + ${totalOrders} órdenes pagadas + ${totalVoids} anuladas${R}`);

  // ── 6. Mermas (shrinkage) ─────────────────────────────────────────────────
  const shrinkReasons = ['Vencimiento', 'Producto dañado', 'Derrame', 'Error de manipulación'];
  for (let i = 0; i < 25; i++) {
    const prod = pick(products);
    const day = rand(0, 20);
    const [{ current_stock }] = await q<{ current_stock: number }[]>(
      `SELECT current_stock FROM products WHERE product_id = $1`,
      [prod.id],
    );
    const qty = Math.min(current_stock, rand(1, 6));
    if (qty <= 0) continue;
    await q(
      `INSERT INTO stock_movements (product_id, movement_type_id, user_id, quantity, stock_before, stock_after, reason, created_at)
       VALUES ($1, 3, $2, $3, $4, $5, $6, NOW() - INTERVAL '${day} days')`,
      [prod.id, rootId, -qty, current_stock, current_stock - qty, pick(shrinkReasons)],
    );
  }
  console.log(`  ${G}✔  mermas registradas${R}`);

  console.log(`\n${G}${B}✔  Seed de demo completado.${R}\n`);
  await AppDataSource.destroy();
}

seed().catch(async (e) => {
  console.error(`\n${Y}✘  Error en seed de demo:${R}`, e);
  try {
    await AppDataSource.destroy();
  } catch {
    /* noop */
  }
  process.exit(1);
});
