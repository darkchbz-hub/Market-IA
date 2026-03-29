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

function validateRegisterInput({ nombre, email, password }) {
  if (!nombre?.trim()) {
    throw new HttpError(400, "El nombre es obligatorio.");
  }

  if (!email?.trim() || !email.includes("@")) {
    throw new HttpError(400, "Debes ingresar un email valido.");
  }

  if (!password || password.length < 8) {
    throw new HttpError(400, "La contrasena debe tener al menos 8 caracteres.");
  }
}

export async function registerUser({ nombre, email, password }) {
  validateRegisterInput({ nombre, email, password });

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new HttpError(409, "Ese email ya esta registrado.");
  }

  const passwordHash = await hashPassword(password);
  const role = normalizedEmail === env.adminEmail.trim().toLowerCase() ? "admin" : "customer";

  const { rows } = await query(
    `
      INSERT INTO users (role, nombre, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, role, nombre, email, direccion, created_at, updated_at
    `,
    [role, nombre.trim(), normalizedEmail, passwordHash]
  );

  return {
    user: mapUserRow(rows[0]),
    token: createAccessToken(buildTokenPayload(rows[0]))
  };
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
