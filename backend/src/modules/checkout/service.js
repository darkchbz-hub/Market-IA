import { query, withTransaction } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";
import { clearCart, getCart } from "../cart/service.js";

function parseJson(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapOrderItem(row) {
  return {
    id: row.id,
    productoId: row.product_id,
    nombre: row.nombre_producto,
    cantidad: Number(row.cantidad),
    precio: Number(row.precio_cents) / 100,
    precioCents: Number(row.precio_cents),
    subtotal: (Number(row.precio_cents) * Number(row.cantidad)) / 100,
    subtotalCents: Number(row.precio_cents) * Number(row.cantidad),
    estado: row.estado,
    variante: parseJson(row.variante, {})
  };
}

function mapOrderRow(row, items = []) {
  return {
    id: row.id,
    usuarioId: row.user_id,
    subtotal: Number(row.subtotal_cents || 0) / 100,
    shipping: Number(row.shipping_cents || 0) / 100,
    discount: Number(row.discount_cents || 0) / 100,
    total: Number(row.total_cents) / 100,
    totalCents: Number(row.total_cents),
    moneda: row.moneda,
    estado: row.estado,
    paymentStatus: row.payment_status,
    shippingStatus: row.shipping_status,
    direccionEnvio: parseJson(row.direccion_envio, {}),
    proveedorPago: row.payment_provider,
    referenciaPago: row.payment_reference,
    fechaEstimada: row.estimated_delivery_at,
    adminNote: row.admin_note || "",
    history: parseJson(row.status_history, []),
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

async function getCouponDiscount(couponCode, subtotalCents, db) {
  if (!couponCode?.trim()) {
    return { amountCents: 0, coupon: null };
  }

  const executor = db ?? { query };
  const { rows } = await executor.query(
    `
      SELECT *
      FROM coupons
      WHERE codigo = $1
        AND activo = TRUE
        AND (vence_en IS NULL OR vence_en > NOW())
      LIMIT 1
    `,
    [couponCode.trim().toUpperCase()]
  );

  const coupon = rows[0];

  if (!coupon) {
    throw new HttpError(404, "El cupon no existe o ya vencio.");
  }

  if (subtotalCents < Number(coupon.minimo_cents || 0)) {
    throw new HttpError(400, "El subtotal no alcanza el minimo requerido por el cupon.");
  }

  const amountCents =
    coupon.tipo === "fixed"
      ? Math.min(Number(coupon.valor || 0), subtotalCents)
      : Math.round(subtotalCents * (Number(coupon.valor || 0) / 100));

  return { amountCents, coupon };
}

export async function getCheckoutSummary(userId) {
  const cart = await getCart(userId);

  if (!cart.items.length) {
    throw new HttpError(400, "Tu carrito esta vacio.");
  }

  return {
    ...cart,
    shipping: 0,
    shippingCents: 0
  };
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

    const subtotalCents = cart.totalCents;
    const shippingCents = Math.max(Number(payload.shippingCents || 0), 0);
    const discountData = await getCouponDiscount(payload.couponCode, subtotalCents, client);
    const discountCents = discountData.amountCents;
    const totalCents = Math.max(subtotalCents + shippingCents - discountCents, 0);
    const estimatedDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5);

    const { rows } = await client.query(
      `
        INSERT INTO orders (
          user_id, subtotal_cents, shipping_cents, discount_cents, total_cents, moneda, estado,
          payment_status, shipping_status, direccion_envio, payment_provider, estimated_delivery_at, status_history
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, 'pendiente', 'pending', 'pending', $7::jsonb, $8, $9, $10::jsonb
        )
        RETURNING *
      `,
      [
        userId,
        subtotalCents,
        shippingCents,
        discountCents,
        totalCents,
        payload.moneda || cart.moneda || "MXN",
        JSON.stringify(payload.direccion),
        payload.proveedorPago || null,
        estimatedDate,
        JSON.stringify([{ estado: "pendiente", fecha: new Date().toISOString(), origen: "sistema" }])
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
          INSERT INTO order_items (order_id, product_id, nombre_producto, cantidad, precio_cents, variante, estado)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'pendiente')
        `,
        [order.id, item.productoId, item.nombre, item.cantidad, item.precioCents, JSON.stringify(item.variante || {})]
      );
    }

    await clearCart(userId, client);

    return getOrderById(order.id, userId, client);
  });
}
