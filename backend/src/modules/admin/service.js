import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

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

async function logAdminAction(adminId, accion, entidad, entidadId = "", detalle = {}) {
  await query(
    `
      INSERT INTO admin_activity_logs (admin_id, accion, entidad, entidad_id, detalle)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [adminId || null, accion, entidad, String(entidadId || ""), JSON.stringify(detalle || {})]
  );
}

function mapProductLite(row) {
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    categoria: row.categoria,
    marca: row.marca || "",
    precio: Number(row.precio_cents) / 100,
    precioAnterior: Number(row.precio_anterior_cents || 0) / 100,
    descuento: Number(row.descuento_porcentaje || 0),
    stock: Number(row.stock || 0),
    activo: Boolean(row.is_active),
    oferta: Boolean(row.oferta),
    recomendado: Boolean(row.recomendado),
    imagenes: parseJson(row.imagenes, [])
  };
}

export async function getAdminSummary() {
  const [usersResult, productsResult, ordersResult, reviewsResult, activityResult] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'customer'`),
    query(`SELECT COUNT(*)::int AS total FROM products WHERE is_active = TRUE`),
    query(
      `
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (WHERE estado = 'pendiente')::int AS pending_orders,
          COUNT(*) FILTER (WHERE estado = 'entregado')::int AS delivered_orders,
          COALESCE(SUM(total_cents) FILTER (WHERE payment_status IN ('paid', 'completed')), 0)::int AS total_revenue_cents
        FROM orders
      `
    ),
    query(`SELECT COUNT(*)::int AS total FROM product_reviews WHERE visible = TRUE`),
    query(
      `
        SELECT l.*, u.nombre
        FROM admin_activity_logs l
        LEFT JOIN users u ON u.id = l.admin_id
        ORDER BY l.created_at DESC
        LIMIT 10
      `
    )
  ]);

  return {
    usuarios: usersResult.rows[0]?.total || 0,
    productosActivos: productsResult.rows[0]?.total || 0,
    ordenes: ordersResult.rows[0]?.total_orders || 0,
    ordenesPendientes: ordersResult.rows[0]?.pending_orders || 0,
    ordenesEntregadas: ordersResult.rows[0]?.delivered_orders || 0,
    ingresos: Number(ordersResult.rows[0]?.total_revenue_cents || 0) / 100,
    ingresosCents: Number(ordersResult.rows[0]?.total_revenue_cents || 0),
    resenasVisibles: reviewsResult.rows[0]?.total || 0,
    actividadReciente: activityResult.rows.map((row) => ({
      id: row.id,
      admin: row.nombre || "Administrador",
      accion: row.accion,
      entidad: row.entidad,
      entidadId: row.entidad_id,
      detalle: parseJson(row.detalle, {}),
      fecha: row.created_at
    }))
  };
}

export async function listAdminUsers(search = "") {
  const values = [];
  let whereClause = `WHERE u.role != 'admin'`;

  if (search?.trim()) {
    values.push(`%${search.trim()}%`);
    whereClause += ` AND (u.nombre ILIKE $1 OR u.email ILIKE $1 OR u.telefono ILIKE $1)`;
  }

  const { rows } = await query(
    `
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.telefono,
        u.nickname,
        u.avatar_url,
        u.direccion,
        u.created_at,
        COUNT(DISTINCT o.id)::int AS total_orders,
        COALESCE(SUM(o.total_cents) FILTER (WHERE o.payment_status IN ('paid', 'completed')), 0)::int AS total_spent_cents
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `,
    values
  );

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono || "",
    nickname: row.nickname || "",
    avatarUrl: row.avatar_url || "",
    direccion: parseJson(row.direccion, {}),
    fechaRegistro: row.created_at,
    totalOrdenes: Number(row.total_orders || 0),
    gastoTotal: Number(row.total_spent_cents || 0) / 100
  }));
}

export async function getAdminUserDetail(userId) {
  const [userResult, cartResult, ordersResult, orderItemsResult] = await Promise.all([
    query(
      `
        SELECT id, nombre, email, telefono, nickname, avatar_url, direccion, created_at
        FROM users
        WHERE id = $1 AND role != 'admin'
      `,
      [userId]
    ),
    query(
      `
        SELECT c.product_id, c.cantidad, p.nombre, p.precio_cents, p.imagenes
        FROM cart_items c
        INNER JOIN products p ON p.id = c.product_id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `,
      [userId]
    ),
    query(
      `
        SELECT *
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
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
    )
  ]);

  const user = userResult.rows[0];

  if (!user) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  const itemsByOrder = new Map();

  for (const row of orderItemsResult.rows) {
    const items = itemsByOrder.get(row.order_id) || [];
    items.push({
      id: row.id,
      productoId: row.product_id,
      nombre: row.nombre_producto,
      cantidad: Number(row.cantidad),
      precio: Number(row.precio_cents) / 100,
      estado: row.estado,
      variante: parseJson(row.variante, {})
    });
    itemsByOrder.set(row.order_id, items);
  }

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || "",
      nickname: user.nickname || "",
      avatarUrl: user.avatar_url || "",
      direccion: parseJson(user.direccion, {}),
      fechaRegistro: user.created_at
    },
    cart: cartResult.rows.map((row) => ({
      productoId: row.product_id,
      nombre: row.nombre,
      cantidad: Number(row.cantidad),
      precio: Number(row.precio_cents) / 100,
      imagenes: parseJson(row.imagenes, []),
      estado: "pendiente"
    })),
    orders: ordersResult.rows.map((row) => ({
      id: row.id,
      estado: row.estado,
      paymentStatus: row.payment_status,
      shippingStatus: row.shipping_status,
      total: Number(row.total_cents) / 100,
      subtotal: Number(row.subtotal_cents || 0) / 100,
      shipping: Number(row.shipping_cents || 0) / 100,
      discount: Number(row.discount_cents || 0) / 100,
      provider: row.payment_provider,
      direccionEnvio: parseJson(row.direccion_envio, {}),
      fechaEstimada: row.estimated_delivery_at,
      adminNote: row.admin_note || "",
      history: parseJson(row.status_history, []),
      fecha: row.created_at,
      items: itemsByOrder.get(row.id) || []
    }))
  };
}

export async function deleteAdminUser(adminId, userId) {
  const userResult = await query(`SELECT id, role, nombre, email FROM users WHERE id = $1`, [userId]);
  const user = userResult.rows[0];

  if (!user) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  if (user.role === "admin") {
    throw new HttpError(403, "No puedes eliminar cuentas administrador.");
  }

  await query(`DELETE FROM users WHERE id = $1`, [userId]);
  await logAdminAction(adminId, "delete_user", "user", userId, {
    nombre: user.nombre,
    email: user.email
  });

  return { ok: true };
}

export async function listAdminOrders(filters = {}) {
  const values = [];
  const conditions = ["1 = 1"];

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(`(u.nombre ILIKE $${values.length} OR u.email ILIKE $${values.length} OR o.id::text ILIKE $${values.length})`);
  }

  if (filters.estado?.trim()) {
    values.push(filters.estado.trim());
    conditions.push(`o.estado = $${values.length}`);
  }

  const { rows } = await query(
    `
      SELECT
        o.*,
        u.nombre,
        u.email,
        u.telefono
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY o.created_at DESC
    `,
    values
  );

  return rows.map((row) => ({
    id: row.id,
    usuarioId: row.user_id,
    cliente: row.nombre,
    email: row.email,
    telefono: row.telefono || "",
    total: Number(row.total_cents) / 100,
    moneda: row.moneda,
    estado: row.estado,
    paymentStatus: row.payment_status,
    shippingStatus: row.shipping_status,
    proveedorPago: row.payment_provider,
    fecha: row.created_at,
    fechaEstimada: row.estimated_delivery_at
  }));
}

export async function updateAdminOrder(adminId, orderId, payload) {
  const allowedOrderStatuses = ["pendiente", "pagado", "preparando", "enviado", "entregado", "cancelado"];
  const allowedPaymentStatuses = ["pending", "paid", "completed", "failed", "cancelled"];
  const allowedShippingStatuses = ["pending", "preparing", "shipped", "delivered", "cancelled"];

  const currentResult = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  const current = currentResult.rows[0];

  if (!current) {
    throw new HttpError(404, "Pedido no encontrado.");
  }

  const nextEstado = allowedOrderStatuses.includes(payload.estado) ? payload.estado : current.estado;
  const nextPaymentStatus = allowedPaymentStatuses.includes(payload.paymentStatus) ? payload.paymentStatus : current.payment_status;
  const nextShippingStatus = allowedShippingStatuses.includes(payload.shippingStatus) ? payload.shippingStatus : current.shipping_status;
  const nextAdminNote = payload.adminNote !== undefined ? String(payload.adminNote || "") : current.admin_note;
  const nextEstimatedDate = payload.fechaEstimada !== undefined ? payload.fechaEstimada || null : current.estimated_delivery_at;
  const nextHistory = [
    ...parseJson(current.status_history, []),
    {
      estado: nextEstado,
      paymentStatus: nextPaymentStatus,
      shippingStatus: nextShippingStatus,
      fecha: new Date().toISOString(),
      origen: "admin"
    }
  ];

  await query(
    `
      UPDATE orders
      SET
        estado = $2,
        payment_status = $3,
        shipping_status = $4,
        admin_note = $5,
        estimated_delivery_at = $6,
        status_history = $7::jsonb,
        updated_at = NOW()
      WHERE id = $1
    `,
    [orderId, nextEstado, nextPaymentStatus, nextShippingStatus, nextAdminNote, nextEstimatedDate, JSON.stringify(nextHistory)]
  );

  if (payload.estado) {
    await query(`UPDATE order_items SET estado = $2 WHERE order_id = $1`, [orderId, nextEstado]);
  }

  await logAdminAction(adminId, "update_order", "order", orderId, payload);

  return { ok: true };
}

export async function listAdminAnalytics() {
  const [viewsResult, searchesResult, providerResult] = await Promise.all([
    query(
      `
        SELECT
          p.id,
          p.nombre,
          p.slug,
          COUNT(pv.id)::int AS total_views
        FROM products p
        LEFT JOIN product_views pv ON pv.product_id = p.id
        GROUP BY p.id
        ORDER BY total_views DESC, p.created_at DESC
        LIMIT 10
      `
    ),
    query(
      `
        SELECT busqueda, COUNT(*)::int AS total
        FROM search_history
        GROUP BY busqueda
        ORDER BY total DESC, busqueda ASC
        LIMIT 10
      `
    ),
    query(
      `
        SELECT
          COALESCE(payment_provider, 'sin_definir') AS provider,
          COUNT(*)::int AS total_orders,
          COALESCE(SUM(total_cents) FILTER (WHERE payment_status IN ('paid', 'completed')), 0)::int AS total_revenue_cents
        FROM orders
        GROUP BY COALESCE(payment_provider, 'sin_definir')
        ORDER BY total_orders DESC
      `
    )
  ]);

  return {
    productosMasVistos: viewsResult.rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      slug: row.slug,
      vistas: row.total_views
    })),
    busquedasPopulares: searchesResult.rows.map((row) => ({
      termino: row.busqueda,
      total: row.total
    })),
    ventasPorProveedor: providerResult.rows.map((row) => ({
      proveedor: row.provider,
      ordenes: row.total_orders,
      ingresos: Number(row.total_revenue_cents) / 100
    }))
  };
}

export async function listAdminProducts() {
  const { rows } = await query(`SELECT * FROM products ORDER BY created_at DESC`);
  return rows.map(mapProductLite);
}

export async function listAdminReviews() {
  const { rows } = await query(
    `
      SELECT pr.*, p.nombre AS producto_nombre, u.nombre, u.nickname
      FROM product_reviews pr
      INNER JOIN products p ON p.id = pr.product_id
      INNER JOIN users u ON u.id = pr.user_id
      ORDER BY pr.created_at DESC
    `
  );

  return rows.map((row) => ({
    id: row.id,
    productoId: row.product_id,
    productoNombre: row.producto_nombre,
    usuarioNombre: row.nombre,
    nickname: row.nickname || "",
    rating: Number(row.rating),
    comentario: row.comentario,
    visible: Boolean(row.visible),
    verificada: Boolean(row.verificada),
    fecha: row.created_at
  }));
}

export async function deleteAdminReview(adminId, reviewId) {
  await query(`DELETE FROM product_reviews WHERE id = $1`, [reviewId]);
  await logAdminAction(adminId, "delete_review", "review", reviewId);
  return { ok: true };
}

export async function listAdminCategories() {
  const { rows } = await query(`SELECT * FROM categories ORDER BY sort_order ASC, nombre ASC`);
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    slug: row.slug,
    descripcion: row.descripcion || "",
    icono: row.icono || "",
    color: row.color || "#1d4ed8",
    destacada: Boolean(row.featured),
    activa: Boolean(row.is_active),
    orden: Number(row.sort_order || 0)
  }));
}

export async function createAdminCategory(adminId, payload) {
  const { rows } = await query(
    `
      INSERT INTO categories (nombre, slug, descripcion, icono, color, featured, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      payload.nombre,
      payload.slug,
      payload.descripcion || "",
      payload.icono || "",
      payload.color || "#1d4ed8",
      Boolean(payload.destacada),
      Number(payload.orden || 0),
      payload.activa !== undefined ? Boolean(payload.activa) : true
    ]
  );

  await logAdminAction(adminId, "create_category", "category", rows[0].id, payload);
  return rows[0];
}

export async function updateAdminCategory(adminId, categoryId, payload) {
  const { rows } = await query(
    `
      UPDATE categories
      SET
        nombre = COALESCE($2, nombre),
        slug = COALESCE($3, slug),
        descripcion = COALESCE($4, descripcion),
        icono = COALESCE($5, icono),
        color = COALESCE($6, color),
        featured = COALESCE($7, featured),
        sort_order = COALESCE($8, sort_order),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      categoryId,
      payload.nombre ?? null,
      payload.slug ?? null,
      payload.descripcion ?? null,
      payload.icono ?? null,
      payload.color ?? null,
      payload.destacada ?? null,
      payload.orden ?? null,
      payload.activa ?? null
    ]
  );

  if (!rows[0]) {
    throw new HttpError(404, "Categoria no encontrada.");
  }

  await logAdminAction(adminId, "update_category", "category", categoryId, payload);
  return rows[0];
}

export async function deleteAdminCategory(adminId, categoryId) {
  await query(`DELETE FROM categories WHERE id = $1`, [categoryId]);
  await logAdminAction(adminId, "delete_category", "category", categoryId);
  return { ok: true };
}

export async function getAdminContent() {
  const [homepageSettings, generalSettings, banners, videos, music] = await Promise.all([
    query(`SELECT content FROM site_settings WHERE scope = 'homepage' LIMIT 1`),
    query(`SELECT content FROM site_settings WHERE scope = 'general' LIMIT 1`),
    query(`SELECT * FROM site_banners ORDER BY orden ASC, created_at DESC`),
    query(`SELECT * FROM promo_videos ORDER BY orden ASC, created_at DESC`),
    query(`SELECT * FROM music_tracks ORDER BY orden ASC, created_at DESC`)
  ]);

  return {
    homepage: parseJson(homepageSettings.rows[0]?.content, {}),
    general: parseJson(generalSettings.rows[0]?.content, {}),
    banners: banners.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      subtitulo: row.subtitulo,
      mediaUrl: row.media_url,
      linkUrl: row.link_url,
      orden: Number(row.orden || 0),
      activa: Boolean(row.is_active)
    })),
    videos: videos.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      videoUrl: row.video_url,
      posterUrl: row.poster_url,
      orden: Number(row.orden || 0),
      activa: Boolean(row.is_active)
    })),
    music: music.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      artista: row.artista,
      audioUrl: row.audio_url,
      portadaUrl: row.portada_url,
      orden: Number(row.orden || 0),
      activa: Boolean(row.is_active)
    }))
  };
}

export async function saveAdminSetting(adminId, scope, content) {
  await query(
    `
      INSERT INTO site_settings (scope, content, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (scope)
      DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
    `,
    [scope, JSON.stringify(content || {})]
  );

  await logAdminAction(adminId, "save_setting", "setting", scope, content);
  return { ok: true };
}

async function saveMediaRecord(tableName, adminId, payload, mediaId = null) {
  const tableConfig = {
    site_banners: {
      columns: ["titulo", "subtitulo", "media_url", "link_url", "orden", "is_active"],
      values: [payload.titulo, payload.subtitulo || "", payload.mediaUrl, payload.linkUrl || "", Number(payload.orden || 0), Boolean(payload.activa)]
    },
    promo_videos: {
      columns: ["titulo", "descripcion", "video_url", "poster_url", "orden", "is_active"],
      values: [payload.titulo, payload.descripcion || "", payload.videoUrl, payload.posterUrl || "", Number(payload.orden || 0), Boolean(payload.activa)]
    },
    music_tracks: {
      columns: ["titulo", "artista", "audio_url", "portada_url", "orden", "is_active"],
      values: [payload.titulo, payload.artista || "", payload.audioUrl, payload.portadaUrl || "", Number(payload.orden || 0), Boolean(payload.activa)]
    }
  };

  const config = tableConfig[tableName];

  if (!config) {
    throw new HttpError(500, "Tipo de medio no soportado.");
  }

  if (mediaId) {
    const setClause = config.columns.map((column, index) => `${column} = $${index + 2}`).join(", ");
    await query(`UPDATE ${tableName} SET ${setClause} WHERE id = $1`, [mediaId, ...config.values]);
    await logAdminAction(adminId, "update_media", tableName, mediaId, payload);
    return { ok: true };
  }

  const placeholders = config.columns.map((_, index) => `$${index + 1}`).join(", ");
  await query(`INSERT INTO ${tableName} (${config.columns.join(", ")}) VALUES (${placeholders})`, config.values);
  await logAdminAction(adminId, "create_media", tableName, "", payload);
  return { ok: true };
}

export async function saveAdminBanner(adminId, payload, bannerId = null) {
  return saveMediaRecord("site_banners", adminId, payload, bannerId);
}

export async function saveAdminVideo(adminId, payload, videoId = null) {
  return saveMediaRecord("promo_videos", adminId, payload, videoId);
}

export async function saveAdminMusic(adminId, payload, musicId = null) {
  return saveMediaRecord("music_tracks", adminId, payload, musicId);
}

export async function deleteAdminMedia(adminId, type, id) {
  const tableByType = {
    banner: "site_banners",
    video: "promo_videos",
    music: "music_tracks"
  };

  const tableName = tableByType[type];

  if (!tableName) {
    throw new HttpError(400, "Tipo de medio invalido.");
  }

  await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
  await logAdminAction(adminId, "delete_media", type, id);
  return { ok: true };
}
