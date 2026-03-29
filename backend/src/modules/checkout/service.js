import { query, withTransaction } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";
import { clearCart, getCart } from "../cart/service.js";

function mapOrderItem(row) {
  return {
    id: row.id,
    productoId: row.product_id,
    nombre: row.nombre_producto,
    cantidad: Number(row.cantidad),
    precio: Number(row.precio_cents) / 100,
    precioCents: Number(row.precio_cents),
    subtotal: (Number(row.precio_cents) * Number(row.cantidad)) / 100,
    subtotalCents: Number(row.precio_cents) * Number(row.cantidad)
  };
}

function mapOrderRow(row, items = []) {
  return {
    id: row.id,
    usuarioId: row.user_id,
    total: Number(row.total_cents) / 100,
    totalCents: Number(row.total_cents),
    moneda: row.moneda,
    estado: row.estado,
    direccionEnvio: row.direccion_envio || {},
    proveedorPago: row.payment_provider,
    referenciaPago: row.payment_reference,
    fecha: row.created_at,
    actualizadoEn: row.updated_at,
    items
  };
}

function validateAddress(direccion) {
  if (!direccion || typeof direccion !== "object") {
    throw new HttpError(400, "Debes enviar una direccion valida.");
  }

  const requiredKeys = ["calle", "ciudad", "estado", "cp", "pais"];
  const missing = requiredKeys.filter((key) => !String(direccion[key] || "").trim());

  if (missing.length) {
    throw new HttpError(400, `Faltan datos de direccion: ${missing.join(", ")}`);
  }
}

export async function getCheckoutSummary(userId) {
  const cart = await getCart(userId);

  if (!cart.items.length) {
    throw new HttpError(400, "Tu carrito esta vacio.");
  }

  return cart;
}

export async function getOrderById(orderId, userId, db) {
  const executor = db ?? { query };
  const values = [orderId];
  const conditions = ["id = $1"];

  if (userId) {
    values.push(userId);
    conditions.push(`user_id = $${values.length}`);
  }

  const orderResult = await executor.query(
    `
      SELECT *
      FROM orders
      WHERE ${conditions.join(" AND ")}
    `,
    values
  );

  if (!orderResult.rows[0]) {
    throw new HttpError(404, "Orden no encontrada.");
  }

  const itemsResult = await executor.query(
    `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
    `,
    [orderId]
  );

  return mapOrderRow(orderResult.rows[0], itemsResult.rows.map(mapOrderItem));
}

export async function listOrdersByUser(userId) {
  const ordersResult = await query(
    `
      SELECT *
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  if (!ordersResult.rows.length) {
    return [];
  }

  const orderIds = ordersResult.rows.map((row) => row.id);
  const itemsResult = await query(
    `
      SELECT *
      FROM order_items
      WHERE order_id = ANY($1::uuid[])
      ORDER BY id ASC
    `,
    [orderIds]
  );

  const itemsByOrder = new Map();

  for (const row of itemsResult.rows) {
    const list = itemsByOrder.get(row.order_id) || [];
    list.push(mapOrderItem(row));
    itemsByOrder.set(row.order_id, list);
  }

  return ordersResult.rows.map((row) => mapOrderRow(row, itemsByOrder.get(row.id) || []));
}

export async function createOrderFromCart(userId, payload) {
  validateAddress(payload.direccion);

  return withTransaction(async (client) => {
    const cart = await getCart(userId, client);

    if (!cart.items.length) {
      throw new HttpError(400, "Tu carrito esta vacio.");
    }

    const { rows } = await client.query(
      `
        INSERT INTO orders (user_id, total_cents, moneda, estado, direccion_envio, payment_provider)
        VALUES ($1, $2, $3, 'pending', $4::jsonb, $5)
        RETURNING *
      `,
      [
        userId,
        cart.totalCents,
        payload.moneda || cart.moneda || "MXN",
        JSON.stringify(payload.direccion),
        payload.proveedorPago || null
      ]
    );

    const order = rows[0];

    for (const item of cart.items) {
      const stockResult = await client.query(
        `
          UPDATE products
          SET stock = stock - $1, updated_at = NOW()
          WHERE id = $2 AND stock >= $1
          RETURNING id
        `,
        [item.cantidad, item.productoId]
      );

      if (!stockResult.rows[0]) {
        throw new HttpError(400, `No hay stock suficiente para ${item.nombre}.`);
      }

      await client.query(
        `
          INSERT INTO order_items (order_id, product_id, nombre_producto, cantidad, precio_cents)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [order.id, item.productoId, item.nombre, item.cantidad, item.precioCents]
      );
    }

    await clearCart(userId, client);

    return getOrderById(order.id, userId, client);
  });
}
