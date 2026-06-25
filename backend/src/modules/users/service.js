import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

function getExecutor(db) {
  return db ?? { query };
}

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

export function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono || "",
    nickname: row.nickname || "",
    avatarUrl: row.avatar_url || "",
    isActive: row.is_active !== false,
    direccion: parseJson(row.direccion, {}),
    fechaRegistro: row.created_at,
    actualizadoEn: row.updated_at
  };
}

export async function getUserById(userId, db) {
  const executor = getExecutor(db);
  const { rows } = await executor.query(
    `
      SELECT id, role, nombre, email, telefono, nickname, avatar_url, is_active, direccion, created_at, updated_at
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function getUserByEmail(email, db) {
  const executor = getExecutor(db);
  const { rows } = await executor.query(
    `
      SELECT id, role, nombre, email, telefono, nickname, avatar_url, is_active, password_hash, direccion, created_at, updated_at
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  return rows[0] || null;
}

export async function updateCurrentUser(userId, payload) {
  const values = [];
  const updates = [];

  const pushUpdate = (column, value, cast = "") => {
    values.push(value);
    updates.push(`${column} = $${values.length}${cast}`);
  };

  if (payload.nombre?.trim()) {
    pushUpdate("nombre", payload.nombre.trim());
  }

  if (payload.email?.trim()) {
    pushUpdate("email", payload.email.trim().toLowerCase());
  }

  if (payload.telefono !== undefined) {
    pushUpdate("telefono", String(payload.telefono || "").trim());
  }

  if (payload.nickname !== undefined) {
    pushUpdate("nickname", String(payload.nickname || "").trim());
  }

  if (payload.avatarUrl !== undefined) {
    pushUpdate("avatar_url", String(payload.avatarUrl || "").trim());
  }

  if (payload.direccion && typeof payload.direccion === "object") {
    pushUpdate("direccion", JSON.stringify(payload.direccion), "::jsonb");
  }

  if (!updates.length) {
    throw new HttpError(400, "Debes enviar al menos un dato para actualizar.");
  }

  values.push(userId);

  try {
    const { rows } = await query(
      `
        UPDATE users
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, role, nombre, email, telefono, nickname, avatar_url, is_active, direccion, created_at, updated_at
      `,
      values
    );

    if (!rows[0]) {
      throw new HttpError(404, "Usuario no encontrado.");
    }

    return mapUserRow(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      if (error.constraint?.includes("email")) {
        throw new HttpError(409, "Ese email ya esta registrado.");
      }

      if (error.constraint?.includes("nickname")) {
        throw new HttpError(409, "Ese nickname ya esta ocupado.");
      }
    }

    throw error;
  }
}

function mapOrderRow(row) {
  return {
    id: row.id,
    subtotal: Number(row.subtotal_cents || 0) / 100,
    shipping: Number(row.shipping_cents || 0) / 100,
    discount: Number(row.discount_cents || 0) / 100,
    total: Number(row.total_cents || 0) / 100,
    totalCents: Number(row.total_cents || 0),
    moneda: row.moneda,
    estado: row.estado,
    paymentStatus: row.payment_status,
    shippingStatus: row.shipping_status,
    metodoPago: row.payment_provider,
    direccionEnvio: parseJson(row.direccion_envio, {}),
    fechaEstimada: row.estimated_delivery_at,
    adminNote: row.admin_note || "",
    fecha: row.created_at,
    actualizadoEn: row.updated_at
  };
}

function mapFavoriteRow(row) {
  return {
    id: row.product_id,
    slug: row.slug,
    nombre: row.nombre,
    categoria: row.categoria,
    precio: Number(row.precio_cents) / 100,
    imagenes: parseJson(row.imagenes, [])
  };
}

export async function getUserDashboard(userId) {
  const [userResult, ordersResult, orderItemsResult, searchesResult, viewsResult, favoritesResult] = await Promise.all([
    query(
      `
        SELECT id, role, nombre, email, telefono, nickname, avatar_url, is_active, direccion, created_at, updated_at
        FROM users
        WHERE id = $1
      `,
      [userId]
    ),
    query(
      `
        SELECT *
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `,
      [userId]
    ),
    query(
      `
        SELECT oi.*, o.user_id
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = $1
        ORDER BY oi.id DESC
      `,
      [userId]
    ),
    query(
      `
        SELECT id, busqueda, created_at
        FROM search_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `,
      [userId]
    ),
    query(
      `
        SELECT pv.id, pv.created_at, p.id AS product_id, p.nombre, p.slug
        FROM product_views pv
        INNER JOIN products p ON p.id = pv.product_id
        WHERE pv.user_id = $1
        ORDER BY pv.created_at DESC
        LIMIT 10
      `,
      [userId]
    ),
    query(
      `
        SELECT w.product_id, p.slug, p.nombre, p.categoria, p.precio_cents, p.imagenes
        FROM wishlist_items w
        INNER JOIN products p ON p.id = w.product_id
        WHERE w.user_id = $1
        ORDER BY w.created_at DESC
      `,
      [userId]
    )
  ]);

  if (!userResult.rows[0]) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  const itemsByOrder = new Map();

  for (const row of orderItemsResult.rows) {
    const currentItems = itemsByOrder.get(row.order_id) || [];
    currentItems.push({
      id: row.id,
      productoId: row.product_id,
      nombre: row.nombre_producto,
      cantidad: Number(row.cantidad),
      precio: Number(row.precio_cents) / 100,
      subtotal: (Number(row.precio_cents) * Number(row.cantidad)) / 100,
      estado: row.estado,
      variante: parseJson(row.variante, {})
    });
    itemsByOrder.set(row.order_id, currentItems);
  }

  return {
    user: mapUserRow(userResult.rows[0]),
    historial: {
      ordenes: ordersResult.rows.map((row) => ({
        ...mapOrderRow(row),
        items: itemsByOrder.get(row.id) || [],
        cancelable: ["pendiente", "pagado", "preparando"].includes(row.estado)
      })),
      busquedas: searchesResult.rows.map((row) => ({
        id: row.id,
        busqueda: row.busqueda,
        fecha: row.created_at
      })),
      productosVistos: viewsResult.rows.map((row) => ({
        id: row.id,
        fecha: row.created_at,
        producto: {
          id: row.product_id,
          nombre: row.nombre,
          slug: row.slug
        }
      })),
      favoritos: favoritesResult.rows.map(mapFavoriteRow)
    }
  };
}

export async function addFavorite(userId, productId) {
  await query(
    `
      INSERT INTO wishlist_items (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `,
    [userId, productId]
  );

  return { ok: true };
}

export async function removeFavorite(userId, productId) {
  await query(
    `
      DELETE FROM wishlist_items
      WHERE user_id = $1 AND product_id = $2
    `,
    [userId, productId]
  );

  return { ok: true };
}

export async function cancelOwnOrder(userId, orderId) {
  const { rows } = await query(
    `
      SELECT *
      FROM orders
      WHERE id = $1 AND user_id = $2
    `,
    [orderId, userId]
  );

  if (!rows[0]) {
    throw new HttpError(404, "Pedido no encontrado.");
  }

  if (!["pendiente", "pagado", "preparando"].includes(rows[0].estado)) {
    throw new HttpError(400, "Este pedido ya no se puede cancelar.");
  }

  await query(
    `
      UPDATE orders
      SET
        estado = 'cancelado',
        shipping_status = 'cancelled',
        updated_at = NOW(),
        status_history = COALESCE(status_history, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object('estado', 'cancelado', 'fecha', NOW(), 'origen', 'usuario')
        )
      WHERE id = $1
    `,
    [orderId]
  );

  await query(
    `
      UPDATE order_items
      SET estado = 'cancelado'
      WHERE order_id = $1
    `,
    [orderId]
  );

  return { ok: true };
}
