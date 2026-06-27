import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeStringList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeJsonList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
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

function toCents(value) {
  const amount = Number(value);

  if (Number.isNaN(amount) || amount < 0) {
    throw new HttpError(400, "El precio es invalido.");
  }

  return Math.round(amount * 100);
}

function normalizeMethods(value) {
  const methods = normalizeStringList(value);
  return methods.length ? methods : ["Tarjeta", "PayPal", "Mercado Pago"];
}

function normalizeBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function buildProductSelect(whereClause = "", orderClause = "p.created_at DESC", limitClause = "") {
  return `
    SELECT
      p.*,
      COALESCE(r.rating_average, 0) AS rating_average,
      COALESCE(r.rating_total, 0) AS rating_total
    FROM products p
    LEFT JOIN (
      SELECT
        product_id,
        ROUND(AVG(rating)::numeric, 1) AS rating_average,
        COUNT(*)::int AS rating_total
      FROM product_reviews
      WHERE visible = TRUE
      GROUP BY product_id
    ) r ON r.product_id = p.id
    ${whereClause}
    ORDER BY ${orderClause}
    ${limitClause}
  `;
}

export function mapProductRow(row) {
  const precioCents = Number(row.precio_cents || 0);
  const precioAnteriorCents = Number(row.precio_anterior_cents || 0);

  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    descripcionCorta: row.descripcion_corta || "",
    marca: row.marca || "",
    precio: precioCents / 100,
    precioCents,
    precioAnterior: precioAnteriorCents / 100,
    precioAnteriorCents,
    descuento: Number(row.descuento_porcentaje || 0),
    moneda: row.moneda,
    imagenes: parseJson(row.imagenes, []),
    stock: Number(row.stock || 0),
    categoria: row.categoria,
    tags: row.tags || [],
    variantes: parseJson(row.variantes, []),
    atributos: parseJson(row.atributos, []),
    metodosPago: parseJson(row.metodos_pago, []),
    vendedorOficial: row.vendedor_oficial || "",
    mostrarSelloOficial: Boolean(row.mostrar_sello_oficial),
    garantia: row.garantia || "",
    devolucion: row.devolucion || "",
    infoEnvio: row.info_envio || "",
    fechaEstimada: row.fecha_estimada || "",
    disponibilidad: row.disponibilidad || "Disponible",
    destacado: Boolean(row.destacado),
    oferta: Boolean(row.oferta),
    masVendido: Boolean(row.mas_vendido),
    recomendado: Boolean(row.recomendado),
    activo: Boolean(row.is_active),
    ratingPromedio: Number(row.rating_average || 0),
    totalOpiniones: Number(row.rating_total || 0),
    fechaCreacion: row.created_at,
    actualizadoEn: row.updated_at
  };
}

export function mapCategoryRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    slug: row.slug,
    descripcion: row.descripcion || "",
    icono: row.icono || "",
    color: row.color || "#1d4ed8",
    destacada: Boolean(row.featured),
    activa: Boolean(row.is_active),
    orden: Number(row.sort_order || 0)
  };
}

function mapReviewRow(row) {
  return {
    id: row.id,
    rating: Number(row.rating),
    comentario: row.comentario,
    visible: Boolean(row.visible),
    verificada: Boolean(row.verificada),
    fecha: row.created_at,
    usuario: {
      id: row.user_id,
      nombre: row.nombre,
      nickname: row.nickname || "",
      avatarUrl: row.avatar_url || ""
    }
  };
}

function mapQuestionRow(row) {
  return {
    id: row.id,
    pregunta: row.pregunta,
    respuesta: row.respuesta || "",
    visible: Boolean(row.visible),
    fecha: row.created_at,
    usuario: {
      id: row.user_id,
      nombre: row.nombre,
      nickname: row.nickname || ""
    }
  };
}

function getSortClause(sort = "") {
  switch (String(sort || "").trim()) {
    case "price_asc":
      return "p.precio_cents ASC, p.created_at DESC";
    case "price_desc":
      return "p.precio_cents DESC, p.created_at DESC";
    case "rating":
      return "COALESCE(r.rating_average, 0) DESC, COALESCE(r.rating_total, 0) DESC, p.created_at DESC";
    case "popular":
      return "p.mas_vendido DESC, p.recomendado DESC, p.created_at DESC";
    case "discount":
      return "p.descuento_porcentaje DESC, p.created_at DESC";
    case "recent":
    default:
      return "p.created_at DESC";
  }
}

export async function listCategories() {
  const { rows } = await query(
    `
      SELECT *
      FROM categories
      WHERE is_active = TRUE
      ORDER BY featured DESC, sort_order ASC, nombre ASC
    `
  );

  return rows.map(mapCategoryRow);
}

export async function getHomepageData() {
  const [settingsResult, generalResult, bannersResult, videosResult, musicResult, categories, featured, offers, bestsellers] =
    await Promise.all([
      query(`SELECT content FROM site_settings WHERE scope = 'homepage' LIMIT 1`),
      query(`SELECT content FROM site_settings WHERE scope = 'general' LIMIT 1`),
      query(`SELECT * FROM site_banners WHERE is_active = TRUE ORDER BY orden ASC, created_at DESC LIMIT 6`),
      query(`SELECT * FROM promo_videos WHERE is_active = TRUE ORDER BY orden ASC, created_at DESC LIMIT 4`),
      query(`SELECT * FROM music_tracks WHERE is_active = TRUE ORDER BY orden ASC, created_at DESC LIMIT 10`),
      listCategories(),
      query(buildProductSelect(`WHERE p.is_active = TRUE AND (p.recomendado = TRUE OR p.destacado = TRUE)`, "p.recomendado DESC, p.destacado DESC, p.created_at DESC", "LIMIT 8")),
      query(buildProductSelect(`WHERE p.is_active = TRUE AND p.oferta = TRUE`, "p.descuento_porcentaje DESC, p.created_at DESC", "LIMIT 8")),
      query(buildProductSelect(`WHERE p.is_active = TRUE AND p.mas_vendido = TRUE`, "p.mas_vendido DESC, p.created_at DESC", "LIMIT 8"))
    ]);

  return {
    settings: parseJson(settingsResult.rows[0]?.content, {}),
    general: parseJson(generalResult.rows[0]?.content, {}),
    categories,
    banners: bannersResult.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      subtitulo: row.subtitulo,
      mediaUrl: row.media_url,
      linkUrl: row.link_url
    })),
    videos: videosResult.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      videoUrl: row.video_url,
      posterUrl: row.poster_url
    })),
    music: musicResult.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      artista: row.artista,
      audioUrl: row.audio_url,
      portadaUrl: row.portada_url
    })),
    featuredProducts: featured.rows.map(mapProductRow),
    offerProducts: offers.rows.map(mapProductRow),
    bestsellerProducts: bestsellers.rows.map(mapProductRow)
  };
}

export async function listProducts(filters = {}) {
  const values = [];
  const conditions = ["p.is_active = TRUE"];
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 60);
  const offset = (page - 1) * limit;

  if (filters.search?.trim()) {
    const terms = filters.search.trim().split(/\s+/).filter(Boolean).slice(0, 8);

    for (const term of terms) {
      values.push(`%${term}%`);
      conditions.push(
        `(p.nombre ILIKE $${values.length} OR p.descripcion ILIKE $${values.length} OR p.descripcion_corta ILIKE $${values.length} OR p.marca ILIKE $${values.length} OR p.categoria ILIKE $${values.length} OR p.tags::text ILIKE $${values.length} OR p.vendedor_oficial ILIKE $${values.length})`
      );
    }
  }

  if (filters.category?.trim()) {
    values.push(filters.category.trim());
    conditions.push(`p.categoria = $${values.length}`);
  }

  if (filters.brand?.trim()) {
    values.push(filters.brand.trim());
    conditions.push(`p.marca = $${values.length}`);
  }

  if (filters.minPrice !== undefined && filters.minPrice !== "") {
    values.push(toCents(filters.minPrice));
    conditions.push(`p.precio_cents >= $${values.length}`);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
    values.push(toCents(filters.maxPrice));
    conditions.push(`p.precio_cents <= $${values.length}`);
  }

  if (filters.rating !== undefined && filters.rating !== "") {
    values.push(Number(filters.rating) || 0);
    conditions.push(`COALESCE(r.rating_average, 0) >= $${values.length}`);
  }

  if (filters.availability?.trim()) {
    values.push(filters.availability.trim());
    conditions.push(`p.disponibilidad = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortClause = getSortClause(filters.sort);

  const [productsResult, countResult, brandsResult] = await Promise.all([
    query(buildProductSelect(whereClause, sortClause, `LIMIT ${limit} OFFSET ${offset}`), values),
    query(
      `
        SELECT COUNT(*)::int AS total
        FROM products p
        LEFT JOIN (
          SELECT
            product_id,
            ROUND(AVG(rating)::numeric, 1) AS rating_average
          FROM product_reviews
          WHERE visible = TRUE
          GROUP BY product_id
        ) r ON r.product_id = p.id
        ${whereClause}
      `,
      values
    ),
    query(
      `
        SELECT DISTINCT marca
        FROM products
        WHERE is_active = TRUE AND marca <> ''
        ORDER BY marca ASC
      `
    )
  ]);

  return {
    items: productsResult.rows.map(mapProductRow),
    filters: {
      brands: brandsResult.rows.map((row) => row.marca).filter(Boolean)
    },
    pagination: {
      page,
      limit,
      total: countResult.rows[0]?.total || 0
    }
  };
}

export async function getProductById(productIdOrSlug, includeInactive = false) {
  const values = [productIdOrSlug];
  const whereParts = ["(p.id::text = $1 OR p.slug = $1)"];

  if (!includeInactive) {
    whereParts.push("p.is_active = TRUE");
  }

  const productResult = await query(
    buildProductSelect(`WHERE ${whereParts.join(" AND ")}`, "p.created_at DESC", "LIMIT 1"),
    values
  );

  const row = productResult.rows[0];

  if (!row) {
    throw new HttpError(404, "Producto no encontrado.");
  }

  const product = mapProductRow(row);

  const [reviewsResult, questionsResult, relatedResult] = await Promise.all([
    query(
      `
        SELECT pr.*, u.nombre, u.nickname, u.avatar_url
        FROM product_reviews pr
        INNER JOIN users u ON u.id = pr.user_id
        WHERE pr.product_id = $1 AND pr.visible = TRUE
        ORDER BY pr.created_at DESC
      `,
      [product.id]
    ),
    query(
      `
        SELECT pq.*, u.nombre, u.nickname
        FROM product_questions pq
        INNER JOIN users u ON u.id = pq.user_id
        WHERE pq.product_id = $1 AND pq.visible = TRUE
        ORDER BY pq.created_at DESC
      `,
      [product.id]
    ),
    query(
      buildProductSelect(
        `WHERE p.is_active = TRUE AND p.categoria = $1 AND p.id <> $2`,
        "p.recomendado DESC, p.mas_vendido DESC, p.created_at DESC",
        "LIMIT 4"
      ),
      [product.categoria, product.id]
    )
  ]);

  return {
    ...product,
    reviews: reviewsResult.rows.map(mapReviewRow),
    questions: questionsResult.rows.map(mapQuestionRow),
    relatedProducts: relatedResult.rows.map(mapProductRow)
  };
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
        INSERT INTO products (
          slug, nombre, descripcion, descripcion_corta, marca, precio_cents, precio_anterior_cents,
          descuento_porcentaje, moneda, imagenes, stock, categoria, tags, variantes, atributos,
          metodos_pago, vendedor_oficial, mostrar_sello_oficial, garantia, devolucion, info_envio,
          fecha_estimada, disponibilidad, destacado, oferta, mas_vendido, recomendado, is_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13::text[],
          $14::jsonb, $15::jsonb, $16::jsonb, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        )
        RETURNING *
      `,
      [
        slug,
        payload.nombre.trim(),
        payload.descripcion.trim(),
        String(payload.descripcionCorta || "").trim(),
        String(payload.marca || "").trim(),
        toCents(payload.precio),
        payload.precioAnterior ? toCents(payload.precioAnterior) : 0,
        Number(payload.descuento || 0),
        payload.moneda?.trim()?.toUpperCase() || "MXN",
        JSON.stringify(normalizeJsonList(payload.imagenes)),
        Math.max(Number(payload.stock) || 0, 0),
        payload.categoria.trim(),
        normalizeStringList(payload.tags),
        JSON.stringify(normalizeJsonList(payload.variantes)),
        JSON.stringify(normalizeJsonList(payload.atributos)),
        JSON.stringify(normalizeMethods(payload.metodosPago)),
        String(payload.vendedorOficial || "").trim(),
        normalizeBoolean(payload.mostrarSelloOficial),
        String(payload.garantia || "").trim(),
        String(payload.devolucion || "").trim(),
        String(payload.infoEnvio || "").trim(),
        String(payload.fechaEstimada || "").trim(),
        String(payload.disponibilidad || "Disponible").trim(),
        normalizeBoolean(payload.destacado),
        normalizeBoolean(payload.oferta),
        normalizeBoolean(payload.masVendido),
        normalizeBoolean(payload.recomendado),
        payload.activo !== undefined ? normalizeBoolean(payload.activo) : true
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

  const pushUpdate = (column, value, cast = "") => {
    values.push(value);
    updates.push(`${column} = $${values.length}${cast}`);
  };

  if (payload.nombre?.trim()) pushUpdate("nombre", payload.nombre.trim());
  if (payload.descripcion?.trim()) pushUpdate("descripcion", payload.descripcion.trim());
  if (payload.descripcionCorta !== undefined) pushUpdate("descripcion_corta", String(payload.descripcionCorta || "").trim());
  if (payload.marca !== undefined) pushUpdate("marca", String(payload.marca || "").trim());
  if (payload.slug?.trim()) pushUpdate("slug", payload.slug.trim());
  if (payload.precio !== undefined) pushUpdate("precio_cents", toCents(payload.precio));
  if (payload.precioAnterior !== undefined) pushUpdate("precio_anterior_cents", payload.precioAnterior ? toCents(payload.precioAnterior) : 0);
  if (payload.descuento !== undefined) pushUpdate("descuento_porcentaje", Math.max(Number(payload.descuento) || 0, 0));
  if (payload.moneda?.trim()) pushUpdate("moneda", payload.moneda.trim().toUpperCase());
  if (payload.imagenes !== undefined) pushUpdate("imagenes", JSON.stringify(normalizeJsonList(payload.imagenes)), "::jsonb");
  if (payload.stock !== undefined) pushUpdate("stock", Math.max(Number(payload.stock) || 0, 0));
  if (payload.categoria?.trim()) pushUpdate("categoria", payload.categoria.trim());
  if (payload.tags !== undefined) pushUpdate("tags", normalizeStringList(payload.tags), "::text[]");
  if (payload.variantes !== undefined) pushUpdate("variantes", JSON.stringify(normalizeJsonList(payload.variantes)), "::jsonb");
  if (payload.atributos !== undefined) pushUpdate("atributos", JSON.stringify(normalizeJsonList(payload.atributos)), "::jsonb");
  if (payload.metodosPago !== undefined) pushUpdate("metodos_pago", JSON.stringify(normalizeMethods(payload.metodosPago)), "::jsonb");
  if (payload.vendedorOficial !== undefined) pushUpdate("vendedor_oficial", String(payload.vendedorOficial || "").trim());
  if (payload.mostrarSelloOficial !== undefined) pushUpdate("mostrar_sello_oficial", normalizeBoolean(payload.mostrarSelloOficial));
  if (payload.garantia !== undefined) pushUpdate("garantia", String(payload.garantia || "").trim());
  if (payload.devolucion !== undefined) pushUpdate("devolucion", String(payload.devolucion || "").trim());
  if (payload.infoEnvio !== undefined) pushUpdate("info_envio", String(payload.infoEnvio || "").trim());
  if (payload.fechaEstimada !== undefined) pushUpdate("fecha_estimada", String(payload.fechaEstimada || "").trim());
  if (payload.disponibilidad !== undefined) pushUpdate("disponibilidad", String(payload.disponibilidad || "Disponible").trim());
  if (payload.destacado !== undefined) pushUpdate("destacado", normalizeBoolean(payload.destacado));
  if (payload.oferta !== undefined) pushUpdate("oferta", normalizeBoolean(payload.oferta));
  if (payload.masVendido !== undefined) pushUpdate("mas_vendido", normalizeBoolean(payload.masVendido));
  if (payload.recomendado !== undefined) pushUpdate("recomendado", normalizeBoolean(payload.recomendado));
  if (payload.activo !== undefined) pushUpdate("is_active", normalizeBoolean(payload.activo));

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

export async function addProductQuestion(productId, userId, payload) {
  if (!payload.pregunta?.trim()) {
    throw new HttpError(400, "La pregunta es obligatoria.");
  }

  await getProductById(productId);

  const { rows } = await query(
    `
      INSERT INTO product_questions (product_id, user_id, pregunta)
      VALUES ($1, $2, $3)
      RETURNING id, pregunta, respuesta, visible, created_at
    `,
    [productId, userId, payload.pregunta.trim()]
  );

  return rows[0];
}

export async function addProductReview(productId, userId, payload) {
  const rating = Number(payload.rating);
  const comentario = String(payload.comentario || "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "La calificacion debe ser entre 1 y 5.");
  }

  if (!comentario) {
    throw new HttpError(400, "El comentario es obligatorio.");
  }

  const purchaseResult = await query(
    `
      SELECT o.id
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
        AND oi.product_id = $2
        AND o.payment_status IN ('paid', 'completed')
      ORDER BY o.created_at DESC
      LIMIT 1
    `,
    [userId, productId]
  );

  if (!purchaseResult.rows[0]) {
    throw new HttpError(403, "Solo pueden opinar usuarios que compraron este producto.");
  }

  const { rows } = await query(
    `
      INSERT INTO product_reviews (product_id, user_id, order_id, rating, comentario, visible, verificada)
      VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
      ON CONFLICT (product_id, user_id)
      DO UPDATE SET
        order_id = EXCLUDED.order_id,
        rating = EXCLUDED.rating,
        comentario = EXCLUDED.comentario,
        visible = TRUE,
        verificada = TRUE,
        updated_at = NOW()
      RETURNING *
    `,
    [productId, userId, purchaseResult.rows[0].id, rating, comentario]
  );

  return rows[0];
}
