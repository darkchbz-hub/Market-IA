import crypto from "crypto";
import { env } from "../../config/env.js";
import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";
import { comparePassword, hashPassword } from "../../shared/passwords.js";
import { createAccessToken } from "../../shared/tokens.js";
import { getUserByEmail, getUserById, mapUserRow } from "../users/service.js";

function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    nombre: user.nombre
  };
}

function validateRegisterInput({ nombre, email, password, telefono, acceptedTerms }) {
  if (!nombre?.trim()) {
    throw new HttpError(400, "El nombre es obligatorio.");
  }

  if (!email?.trim() || !email.includes("@")) {
    throw new HttpError(400, "Debes ingresar un email valido.");
  }

  if (!telefono?.trim()) {
    throw new HttpError(400, "El telefono es obligatorio.");
  }

  if (!password || password.length < 8) {
    throw new HttpError(400, "La contrasena debe tener al menos 8 caracteres.");
  }

  if (acceptedTerms !== true) {
    throw new HttpError(400, "Debes aceptar los terminos y condiciones de Gray C Shop.");
  }
}

export async function registerUser({ nombre, email, password, telefono = "", nickname = "", direccion = {}, acceptedTerms = false }) {
  validateRegisterInput({ nombre, email, password, telefono, acceptedTerms });

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new HttpError(409, "Ese email ya esta registrado.");
  }

  const passwordHash = await hashPassword(password);
  const role = normalizedEmail === env.adminEmail.trim().toLowerCase() ? "admin" : "customer";

  try {
    const { rows } = await query(
      `
        INSERT INTO users (role, nombre, email, password_hash, telefono, nickname, direccion)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        RETURNING id, role, nombre, email, telefono, nickname, avatar_url, direccion, created_at, updated_at
      `,
      [role, nombre.trim(), normalizedEmail, passwordHash, telefono.trim(), String(nickname || "").trim(), JSON.stringify(direccion || {})]
    );

    return {
      user: mapUserRow(rows[0]),
      token: createAccessToken(buildTokenPayload(rows[0]))
    };
  } catch (error) {
    if (error.code === "23505" && error.constraint?.includes("nickname")) {
      throw new HttpError(409, "Ese nickname ya esta ocupado.");
    }

    throw error;
  }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new HttpError(400, "Email y contrasena son obligatorios.");
  }

  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    throw new HttpError(401, "Credenciales invalidas.");
  }

  const validPassword = await comparePassword(password, user.password_hash);

  if (!validPassword) {
    throw new HttpError(401, "Credenciales invalidas.");
  }

  return {
    user: mapUserRow(user),
    token: createAccessToken(buildTokenPayload(user))
  };
}

export async function getCurrentUserProfile(userId) {
  const user = await getUserById(userId);

  if (!user) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  return mapUserRow(user);
}

export async function requestPasswordReset(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw new HttpError(400, "Debes ingresar un email.");
  }

  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    return {
      ok: true,
      message: "Si el correo existe, ya se preparo la recuperacion."
    };
  }

  const token = crypto.randomBytes(24).toString("hex");

  await query(
    `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
    `,
    [user.id, token]
  );

  return {
    ok: true,
    message: "Recuperacion generada correctamente.",
    resetToken: token
  };
}

export async function resetPassword({ token, password }) {
  if (!token || !password || password.length < 8) {
    throw new HttpError(400, "Token y nueva contrasena validos son obligatorios.");
  }

  const resetResult = await query(
    `
      SELECT *
      FROM password_resets
      WHERE token = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [token]
  );

  const resetRow = resetResult.rows[0];

  if (!resetRow) {
    throw new HttpError(400, "El token de recuperacion no es valido o ya expiro.");
  }

  const passwordHash = await hashPassword(password);

  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, resetRow.user_id]);
  await query(`UPDATE password_resets SET used_at = NOW() WHERE id = $1`, [resetRow.id]);

  return { ok: true, message: "Contrasena actualizada correctamente." };
}
