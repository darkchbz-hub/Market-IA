import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeImages(images) {
  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images.filter(Boolean);
  }

  return [String(images)];
}

function normalizeTags(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toCents(value) {
  const amount = Number(value);

  if (Number.isNaN(amount) || amount < 0) {
    throw new HttpError(400, "El precio es invalido.");
  }

  return Math.round(amount * 100);
}

export function mapProductRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio_cents) / 100,
    precioCents: Number(row.precio_cents),
    moneda: row.moneda,
    imagenes: row.imagenes || [],
    stock: row.stock,
    categoria: row.categoria,
    tags: row.tags || [],
    activo: row.is_active,
    fechaCreacion: row.created_at,
    actualizadoEn: row.updated_at
  };
}

export async function listProducts(filters = {}) {
  const values = [];
  const conditions = ["is_active = TRUE"];
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 48);
  const offset = (page - 1) * limit;

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(`(nombre ILIKE $${values.length} OR descripcion ILIKE $${values.length} OR slug ILIKE $${values.length})`);
  }

  if (filters.category?.trim()) {
    values.push(filters.category.trim());
    conditions.push(`categoria = $${values.length}`);
  }

  if (filters.minPrice !== undefined && filters.minPrice !== "") {
    values.push(toCents(filters.minPrice));
    conditions.push(`precio_cents >= $${values.length}`);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
    values.push(toCents(filters.maxPrice));
    conditions.push(`precio_cents <= $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const listValues = [...values, limit, offset];

  const [productsResult, countResult] = await Promise.all([
    query(
      `
        SELECT *
        FROM products
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${listValues.length - 1}
        OFFSET $${listValues.length}
      `,
      listValues
    ),
    query(
      `
        SELECT COUNT(*)::int AS total
        FROM products
        ${whereClause}
      `,
      values
    )
  ]);

  return {
    items: productsResult.rows.map(mapProductRow),
    pagination: {
      page,
      limit,
      total: countResult.rows[0]?.total || 0
    }
  };
}

export async function getProductById(productId, includeInactive = false) {
  const conditions = ["id = $1"];

  if (!includeInactive) {
    conditions.push("is_active = TRUE");
  }

  const { rows } = await query(
    `
      SELECT *
      FROM products
      WHERE ${conditions.join(" AND ")}
    `,
    [productId]
  );

  if (!rows[0]) {
    throw new HttpError(404, "Producto no encontrado.");
  }

  return mapProductRow(rows[0]);
}

export async function createProduct(payload) {
  if (!payload.nombre?.trim()) {
    throw new HttpError(400, "El nombre es obligatorio.");
  }

  if (!payload.descripcion?.trim()) {
    throw new HttpError(400, "La descripcion es obligatoria.");
  }

  if (!payload.categoria?.trim()) {
    throw new HttpError(400, "La categoria es obligatoria.");
  }

  const slug = payload.slug?.trim() || slugify(payload.nombre);

  try {
    const { rows } = await query(
      `
        INSERT INTO products (slug, nombre, descripcion, precio_cents, moneda, imagenes, stock, categoria, tags)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9::text[])
        RETURNING *
      `,
      [
        slug,
        payload.nombre.trim(),
        payload.descripcion.trim(),
        toCents(payload.precio),
        payload.moneda?.trim()?.toUpperCase() || "MXN",
        JSON.stringify(normalizeImages(payload.imagenes)),
        Math.max(Number(payload.stock) || 0, 0),
        payload.categoria.trim(),
        normalizeTags(payload.tags)
      ]
    );

    return mapProductRow(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "Ese slug ya existe.");
    }

    throw error;
  }
}

export async function updateProduct(productId, payload) {
  const values = [];
  const updates = [];

  if (payload.nombre?.trim()) {
    values.push(payload.nombre.trim());
    updates.push(`nombre = $${values.length}`);
  }

  if (payload.descripcion?.trim()) {
    values.push(payload.descripcion.trim());
    updates.push(`descripcion = $${values.length}`);
  }

  if (payload.slug?.trim()) {
    values.push(payload.slug.trim());
    updates.push(`slug = $${values.length}`);
  }

  if (payload.precio !== undefined) {
    values.push(toCents(payload.precio));
    updates.push(`precio_cents = $${values.length}`);
  }

  if (payload.moneda?.trim()) {
    values.push(payload.moneda.trim().toUpperCase());
    updates.push(`moneda = $${values.length}`);
  }

  if (payload.imagenes !== undefined) {
    values.push(JSON.stringify(normalizeImages(payload.imagenes)));
    updates.push(`imagenes = $${values.length}::jsonb`);
  }

  if (payload.stock !== undefined) {
    values.push(Math.max(Number(payload.stock) || 0, 0));
    updates.push(`stock = $${values.length}`);
  }

  if (payload.categoria?.trim()) {
    values.push(payload.categoria.trim());
    updates.push(`categoria = $${values.length}`);
  }

  if (payload.tags !== undefined) {
    values.push(normalizeTags(payload.tags));
    updates.push(`tags = $${values.length}::text[]`);
  }

  if (payload.activo !== undefined) {
    values.push(Boolean(payload.activo));
    updates.push(`is_active = $${values.length}`);
  }

  if (!updates.length) {
    throw new HttpError(400, "No hay datos para actualizar.");
  }

  values.push(productId);

  try {
    const { rows } = await query(
      `
        UPDATE products
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING *
      `,
      values
    );

    if (!rows[0]) {
      throw new HttpError(404, "Producto no encontrado.");
    }

    return mapProductRow(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "Ese slug ya existe.");
    }

    throw error;
  }
}

export async function archiveProduct(productId) {
  const { rows } = await query(
    `
      UPDATE products
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [productId]
  );

  if (!rows[0]) {
    throw new HttpError(404, "Producto no encontrado.");
  }

  return mapProductRow(rows[0]);
}

export async function recordProductView(userId, productId) {
  await getProductById(productId);

  await query(
    `
      INSERT INTO product_views (user_id, product_id)
      VALUES ($1, $2)
    `,
    [userId, productId]
  );
}
