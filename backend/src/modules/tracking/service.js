import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

export async function saveSearch(userId, busqueda) {
  if (!busqueda?.trim()) {
    throw new HttpError(400, "La busqueda no puede estar vacia.");
  }

  const { rows } = await query(
    `
      INSERT INTO search_history (user_id, busqueda)
      VALUES ($1, $2)
      RETURNING id, user_id, busqueda, created_at
    `,
    [userId, busqueda.trim()]
  );

  return {
    id: rows[0].id,
    usuarioId: rows[0].user_id,
    busqueda: rows[0].busqueda,
    fecha: rows[0].created_at
  };
}

export async function listSearches(userId) {
  const { rows } = await query(
    `
      SELECT id, user_id, busqueda, created_at
      FROM search_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    usuarioId: row.user_id,
    busqueda: row.busqueda,
    fecha: row.created_at
  }));
}
