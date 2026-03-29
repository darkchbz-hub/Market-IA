import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

function getExecutor(db) {
  return db ?? { query };
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
    direccion: row.direccion || {},
    fechaRegistro: row.created_at,
    actualizadoEn: row.updated_at
  };
}

export async function getUserById(userId, db) {
  const executor = getExecutor(db);
  const { rows } = await executor.query(
    `
      SELECT id, role, nombre, email, direccion, created_at, updated_at
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
      SELECT id, role, nombre, email, password_hash, direccion, created_at, updated_at
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

  if (payload.nombre?.trim()) {
    values.push(payload.nombre.trim());
    updates.push(`nombre = $${values.length}`);
  }

  if (payload.email?.trim()) {
    values.push(payload.email.trim().toLowerCase());
    updates.push(`email = $${values.length}`);
  }

  if (payload.direccion && typeof payload.direccion === "object") {
    values.push(JSON.stringify(payload.direccion));
    updates.push(`direccion = $${values.length}::jsonb`);
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
        RETURNING id, role, nombre, email, direccion, created_at, updated_at
      `,
      values
    );

    if (!rows[0]) {
      throw new HttpError(404, "Usuario no encontrado.");
    }

    return mapUserRow(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "Ese email ya esta registrado.");
    }

    throw error;
  }
}

export async function getUserDashboard(userId) {
  const [userResult, ordersResult, searchesResult, viewsResult] = await Promise.all([
    query(
      `
        SELECT id, role, nombre, email, direccion, created_at, updated_at
        FROM users
        WHERE id = $1
      `,
      [userId]
    ),
    query(
      `
        SELECT id, total_cents, moneda, estado, payment_provider, created_at
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
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
    )
  ]);

  if (!userResult.rows[0]) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  return {
    user: mapUserRow(userResult.rows[0]),
    historial: {
      ordenes: ordersResult.rows.map((row) => ({
        id: row.id,
        total: Number(row.total_cents) / 100,
        totalCents: Number(row.total_cents),
        moneda: row.moneda,
        estado: row.estado,
        metodoPago: row.payment_provider,
        fecha: row.created_at
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
      }))
    }
  };
}
