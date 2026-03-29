import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

function mapMessageRow(row) {
  return {
    id: row.id,
    usuarioId: row.user_id,
    rolRemitente: row.sender_role,
    mensaje: row.mensaje,
    leido: row.leido,
    fecha: row.created_at
  };
}

export async function createMessage({ userId, senderRole, mensaje }) {
  if (!userId) {
    throw new HttpError(400, "No se encontro la conversacion del usuario.");
  }

  if (!mensaje?.trim()) {
    throw new HttpError(400, "El mensaje no puede estar vacio.");
  }

  const { rows } = await query(
    `
      INSERT INTO messages (user_id, sender_role, mensaje, leido)
      VALUES ($1, $2, $3, FALSE)
      RETURNING *
    `,
    [userId, senderRole, mensaje.trim()]
  );

  return mapMessageRow(rows[0]);
}

export async function markConversationAsRead({ userId, readerRole }) {
  const counterpartRole = readerRole === "admin" ? "customer" : "admin";

  await query(
    `
      UPDATE messages
      SET leido = TRUE
      WHERE user_id = $1
        AND sender_role = $2
        AND leido = FALSE
    `,
    [userId, counterpartRole]
  );
}

export async function listThreads() {
  const { rows } = await query(
    `
      SELECT
        m.user_id,
        u.nombre,
        u.email,
        MAX(m.created_at) AS ultimo_mensaje_en,
        COUNT(*) FILTER (WHERE m.leido = FALSE AND m.sender_role = 'customer')::int AS pendientes
      FROM messages m
      INNER JOIN users u ON u.id = m.user_id
      GROUP BY m.user_id, u.nombre, u.email
      ORDER BY ultimo_mensaje_en DESC
    `
  );

  return rows.map((row) => ({
    usuarioId: row.user_id,
    nombre: row.nombre,
    email: row.email,
    ultimoMensajeEn: row.ultimo_mensaje_en,
    mensajesSinLeer: row.pendientes
  }));
}

export async function listConversation({ viewerRole, viewerId, targetUserId }) {
  const userId = viewerRole === "admin" ? targetUserId : viewerId;

  if (!userId) {
    throw new HttpError(400, "Debes indicar el usuario de la conversacion.");
  }

  const { rows } = await query(
    `
      SELECT *
      FROM messages
      WHERE user_id = $1
      ORDER BY created_at ASC
    `,
    [userId]
  );

  await markConversationAsRead({
    userId,
    readerRole: viewerRole
  });

  return rows.map(mapMessageRow);
}
