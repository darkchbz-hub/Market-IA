import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

function getExecutor(db) {
  return db ?? { query };
}

function mapCartItem(row) {
  const precioCents = Number(row.precio_cents);
  const cantidad = Number(row.cantidad);
  const subtotalCents = precioCents * cantidad;

  return {
    productoId: row.product_id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    categoria: row.categoria,
    imagenes: row.imagenes || [],
    cantidad,
    stock: row.stock,
    precio: precioCents / 100,
    precioCents,
    subtotal: subtotalCents / 100,
    subtotalCents,
    moneda: row.moneda
  };
}

export async function getCart(userId, db) {
  const executor = getExecutor(db);
  const { rows } = await executor.query(
    `
      SELECT
        c.product_id,
        c.cantidad,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.imagenes,
        p.precio_cents,
        p.moneda,
        p.stock
      FROM cart_items c
      INNER JOIN products p ON p.id = c.product_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `,
    [userId]
  );

  const items = rows.map(mapCartItem);
  const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);

  return {
    items,
    total: totalCents / 100,
    totalCents,
    moneda: items[0]?.moneda || "MXN"
  };
}

export async function upsertCartItem(userId, { productId, cantidad }, db) {
  const executor = getExecutor(db);
  const quantity = Number(cantidad);

  if (!productId) {
    throw new HttpError(400, "Debes indicar el producto.");
  }

  if (!Number.isInteger(quantity)) {
    throw new HttpError(400, "La cantidad debe ser un numero entero.");
  }

  if (quantity <= 0) {
    await removeCartItem(userId, productId, db);
    return getCart(userId, db);
  }

  const { rows } = await executor.query(
    `
      SELECT id, stock, is_active
      FROM products
      WHERE id = $1
    `,
    [productId]
  );

  if (!rows[0] || !rows[0].is_active) {
    throw new HttpError(404, "El producto no existe o ya no esta disponible.");
  }

  if (quantity > rows[0].stock) {
    throw new HttpError(400, "No hay suficiente stock para esa cantidad.");
  }

  await executor.query(
    `
      INSERT INTO cart_items (user_id, product_id, cantidad)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET cantidad = EXCLUDED.cantidad, updated_at = NOW()
    `,
    [userId, productId, quantity]
  );

  return getCart(userId, db);
}

export async function removeCartItem(userId, productId, db) {
  const executor = getExecutor(db);

  await executor.query(
    `
      DELETE FROM cart_items
      WHERE user_id = $1 AND product_id = $2
    `,
    [userId, productId]
  );

  return getCart(userId, db);
}

export async function clearCart(userId, db) {
  const executor = getExecutor(db);

  await executor.query(
    `
      DELETE FROM cart_items
      WHERE user_id = $1
    `,
    [userId]
  );
}
