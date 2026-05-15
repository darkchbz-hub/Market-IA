import { hashPassword } from "./security.js";

const seedProducts = [];
export const marketplaceCategories = [
  { slug: "tecnologia", nombre: "Tecnologia", descripcion: "Laptops, celulares, accesorios y equipos premium.", icono: "⌘", color: "#2563eb" },
  { slug: "hogar", nombre: "Hogar", descripcion: "Cocina, decoracion, orden y estilo para tus espacios.", icono: "⌂", color: "#0f766e" },
  { slug: "jardin", nombre: "Jardin", descripcion: "Herramientas, macetas y articulos para exterior.", icono: "❋", color: "#16a34a" },
  { slug: "automovil", nombre: "Automovil", descripcion: "Accesorios y soluciones para cada trayecto.", icono: "◈", color: "#f97316" },
  { slug: "empresas", nombre: "Empresas", descripcion: "Recursos y equipo para oficina y negocio.", icono: "▣", color: "#8b5cf6" },
  { slug: "mayoreo", nombre: "Mayoreo", descripcion: "Compras por volumen para venta y distribucion.", icono: "◫", color: "#f59e0b" },
  { slug: "importados", nombre: "Importados", descripcion: "Productos globales y tendencias internacionales.", icono: "◎", color: "#ec4899" },
  { slug: "mascotas", nombre: "Mascotas", descripcion: "Todo para compania, descanso e higiene.", icono: "✦", color: "#22c55e" },
  { slug: "ropa", nombre: "Ropa", descripcion: "Moda, accesorios y colecciones actuales.", icono: "◍", color: "#ef4444" },
  { slug: "juguetes", nombre: "Juguetes", descripcion: "Diversion y regalos para todas las edades.", icono: "★", color: "#06b6d4" },
  { slug: "productos", nombre: "Productos", descripcion: "Categorias generales y destacados del marketplace.", icono: "•", color: "#38bdf8" },
  { slug: "electronica", nombre: "Electronica", descripcion: "Equipos, dispositivos y accesorios.", icono: "▰", color: "#2563eb" },
  { slug: "casa", nombre: "Casa", descripcion: "Soluciones utiles para tu hogar.", icono: "⌂", color: "#14b8a6" },
  { slug: "apps", nombre: "Suscripciones IA", descripcion: "Software, accesos premium, automatizacion y productividad.", icono: "✧", color: "#7c3aed" },
  { slug: "packs", nombre: "Packs", descripcion: "Combos digitales y herramientas completas.", icono: "◇", color: "#f97316" },
  { slug: "webs", nombre: "Servicios web", descripcion: "Landing pages, tiendas y desarrollo.", icono: "◎", color: "#38bdf8" },
  { slug: "mas", nombre: "Mas", descripcion: "Otras oportunidades y categorias especiales.", icono: "…", color: "#94a3b8" }
];
const allowedCategories = marketplaceCategories.map((item) => item.slug);
const defaultSiteContent = {
  home: {
    announcement: "Compra con seguridad, garantia y envio confiable.",
    heroEyebrow: "Marketplace premium",
    heroTitle: "Todo lo que necesitas para tecnologia, hogar, negocio y estilo de vida en un solo lugar.",
    heroDescription:
      "Una plataforma profesional para comprar productos de muchas categorias con experiencia elegante, segura y preparada para crecer.",
    heroPrimary: "Explorar catalogo",
    heroSecondary: "Ver ofertas",
    featuredTitle: "Recomendados para ti",
    offersTitle: "Ofertas especiales",
    bestsellersTitle: "Mas vendidos",
    videoTitle: "Comerciales y novedades",
    musicTitle: "Ambiente de compra"
  },
  general: {
    siteName: "Gray C Shop",
    tagline: "Marketplace elegante para categorias premium y compras confiables.",
    supportEmail: "ventas@graycshop.com",
    supportPhone: "+52 5512345678",
    signupInviteCode: "123456",
    allowedEmailDomains: ["gmail.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "yahoo.com"],
    partnerTitle: "Empresas asociadas",
    partnerLogos: []
  },
  banners: [],
  videos: [],
  music: []
};

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL DEFAULT 'customer',
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      telefono TEXT NOT NULL DEFAULT '',
      nickname TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      geo_meta TEXT NOT NULL DEFAULT '{}',
      direccion TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      precio REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      vendidos INTEGER NOT NULL DEFAULT 0,
      categoria TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      imagenes TEXT NOT NULL DEFAULT '[]',
      envio_gratis INTEGER NOT NULL DEFAULT 0,
      mostrar_envio_gratis INTEGER NOT NULL DEFAULT 0,
      precio_descuento REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      estado TEXT NOT NULL,
      proveedor_pago TEXT NOT NULL,
      direccion TEXT NOT NULL DEFAULT '{}',
      tracking TEXT NOT NULL DEFAULT '[]',
      payment_reference TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      cantidad INTEGER NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      external_id TEXT,
      approval_url TEXT,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      busqueda TEXT NOT NULL,
      fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS product_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS site_content (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS product_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
];

let bootstrapPromise;

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function generateOrderId() {
  const random = crypto.randomUUID().slice(0, 8);
  return `ord_${Date.now()}_${random}`;
}

function getAdminEmail(env) {
  return String(env.ADMIN_EMAIL || "admin@marketzone.mx").trim().toLowerCase();
}

function getAdminPassword(env) {
  return String(env.ADMIN_PASSWORD || "Admin123!").trim();
}

export function serializeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    nombre: row.nombre,
    email: row.email,
    isActive: Boolean(Number(row.is_active ?? 1)),
    telefono: row.telefono || "",
    nickname: row.nickname || "",
    avatarUrl: row.avatar_url || "",
    geoMeta: parseJson(row.geo_meta, {}),
    direccion: parseJson(row.direccion, {})
  };
}

export function serializeProduct(row) {
  const precioBase = Number(row.precio);
  const precioDescuento = Number(row.precio_descuento || 0);
  const descuentoActivo = Number.isFinite(precioDescuento) && precioDescuento > 0 && precioDescuento < precioBase;

  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    descripcionCorta: row.descripcion_corta || "",
    marca: row.marca || "",
    precio: descuentoActivo ? precioDescuento : precioBase,
    precioOriginal: descuentoActivo ? precioBase : 0,
    precioDescuento: descuentoActivo ? precioDescuento : 0,
    descuentoActivo,
    oferta: descuentoActivo,
    descuento: descuentoActivo && precioBase > 0 ? Math.round(((precioBase - precioDescuento) / precioBase) * 100) : 0,
    stock: Number(row.stock),
    vendidos: Number(row.vendidos || 0),
    categoria: row.categoria,
    tags: parseJson(row.tags, []),
    imagenes: parseJson(row.imagenes, []),
    caracteristicas: parseJson(row.caracteristicas, []),
    envioGratis: Boolean(Number(row.envio_gratis || 0)),
    mostrarEnvioGratis: Boolean(Number(row.mostrar_envio_gratis || 0)),
    disponibilidad: row.disponibilidad || (Number(row.stock || 0) > 0 ? "Disponible" : "Agotado"),
    infoEnvio: row.info_envio || "",
    fechaEstimada: row.fecha_estimada || "",
    garantia: row.garantia || "",
    devolucion: row.devolucion || "",
    ratingPromedio: Number(row.rating_promedio || 0),
    ratingTotal: Number(row.rating_total || 0)
  };
}

async function ensureColumn(db, tableName, columnName, definition) {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = (columns.results || []).some((column) => column.name === columnName);

  if (!exists) {
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
}

async function seedDatabase(db, env) {
  if (seedProducts.length) {
    const productCountRow = await db.prepare("SELECT COUNT(*) AS total FROM products").first();

    if (!Number(productCountRow?.total || 0)) {
      for (const product of seedProducts) {
        await db
          .prepare(
            `
            INSERT INTO products (slug, nombre, descripcion, precio, stock, categoria, tags, imagenes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `
          )
          .bind(
            product.slug,
            product.nombre,
            product.descripcion,
            product.precio,
            product.stock,
            product.categoria,
            JSON.stringify(product.tags),
            JSON.stringify(product.imagenes)
          )
          .run();
      }
    }
  }

  const adminEmail = getAdminEmail(env);
  const existingAdmin = await db.prepare("SELECT id FROM users WHERE email = ?").bind(adminEmail).first();
  const passwordHash = await hashPassword(getAdminPassword(env));

  if (!existingAdmin) {
    await db
      .prepare(
        `
        INSERT INTO users (role, nombre, email, password_hash, direccion)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .bind(
        "admin",
        "Administrador Gray C Shop",
        adminEmail,
        passwordHash,
        JSON.stringify({
          calle: "Av. Reforma 100",
          ciudad: "Ciudad de Mexico",
          estado: "CDMX",
          cp: "06600",
          pais: "MX"
        })
      )
      .run();
  } else {
    await db
      .prepare("UPDATE users SET nombre = ?, role = 'admin', password_hash = ? WHERE email = ?")
      .bind("Administrador Gray C Shop", passwordHash, adminEmail)
      .run();
  }

  for (const [key, value] of Object.entries(defaultSiteContent)) {
    const existing = await db.prepare("SELECT clave FROM site_content WHERE clave = ?").bind(key).first();

    if (!existing) {
      await db
        .prepare(
          `
          INSERT INTO site_content (clave, valor)
          VALUES (?, ?)
        `
        )
        .bind(key, JSON.stringify(value))
        .run();
    }
  }
}

export async function ensureDatabase(env) {
  if (!env.DB) {
    throw new Error("Falta la vinculacion D1 'DB' en Cloudflare Pages.");
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      for (const statement of schemaStatements) {
        await env.DB.prepare(statement.trim()).run();
      }

      await ensureColumn(env.DB, "products", "caracteristicas", "TEXT NOT NULL DEFAULT '[]'");
      await ensureColumn(env.DB, "products", "descripcion_corta", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "marca", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "disponibilidad", "TEXT NOT NULL DEFAULT 'Disponible'");
      await ensureColumn(env.DB, "products", "info_envio", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "fecha_estimada", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "garantia", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "devolucion", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "products", "envio_gratis", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "products", "mostrar_envio_gratis", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "products", "precio_descuento", "REAL NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "products", "vendidos", "INTEGER NOT NULL DEFAULT 0");
      await ensureColumn(env.DB, "order_items", "estado", "TEXT NOT NULL DEFAULT 'pendiente'");
      await ensureColumn(env.DB, "order_items", "updated_at", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "orders", "tracking", "TEXT NOT NULL DEFAULT '[]'");
      await ensureColumn(env.DB, "users", "telefono", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "users", "is_active", "INTEGER NOT NULL DEFAULT 1");
      await ensureColumn(env.DB, "users", "nickname", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "users", "avatar_url", "TEXT NOT NULL DEFAULT ''");
      await ensureColumn(env.DB, "users", "geo_meta", "TEXT NOT NULL DEFAULT '{}'");
      await seedDatabase(env.DB, env);
    })().catch((error) => {
      bootstrapPromise = undefined;
      throw error;
    });
  }

  await bootstrapPromise;
  return env.DB;
}

export async function getUserByEmail(db, email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").bind(String(email || "").trim().toLowerCase()).first();
}

export async function getUserById(db, userId) {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
}

async function findUserByNickname(db, nickname) {
  const value = String(nickname || "").trim().toLowerCase();

  if (!value) {
    return null;
  }

  return db.prepare("SELECT id, nickname FROM users WHERE LOWER(nickname) = ?").bind(value).first();
}

export async function isNicknameAvailable(db, nickname, excludeUserId = 0) {
  const existing = await findUserByNickname(db, nickname);
  return !existing || Number(existing.id) === Number(excludeUserId || 0);
}

export async function createUser(db, { nombre, email, passwordHash, telefono = "", nickname = "", avatarUrl = "", direccion = {}, geoMeta = {} }) {
  const cleanNickname = String(nickname || "").trim();

  if (cleanNickname && !(await isNicknameAvailable(db, cleanNickname))) {
    throw new Error("Ese nickname ya esta utilizado.");
  }

  const response = await db
    .prepare(
      `
      INSERT INTO users (nombre, email, password_hash, telefono, nickname, avatar_url, geo_meta, direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      nombre,
      String(email).trim().toLowerCase(),
      passwordHash,
      String(telefono || "").trim(),
      cleanNickname,
      String(avatarUrl || "").trim(),
      JSON.stringify(geoMeta || {}),
      JSON.stringify(direccion || {})
    )
    .run();

  return getUserById(db, response.meta.last_row_id);
}

export async function updateUserAddress(db, userId, direccion, telefono, extras = {}) {
  const nickname = extras?.nickname !== undefined ? String(extras.nickname || "").trim() : null;
  const avatarUrl = extras?.avatarUrl !== undefined ? String(extras.avatarUrl || "").trim() : null;
  const geoMeta = extras?.geoMeta !== undefined ? JSON.stringify(extras.geoMeta || {}) : null;

  if (nickname && !(await isNicknameAvailable(db, nickname, userId))) {
    throw new Error("Ese nickname ya esta utilizado.");
  }

  await db
    .prepare(
      `
      UPDATE users
      SET
        direccion = ?,
        telefono = COALESCE(?, telefono),
        nickname = COALESCE(?, nickname),
        avatar_url = COALESCE(?, avatar_url),
        geo_meta = COALESCE(?, geo_meta)
      WHERE id = ?
    `
    )
    .bind(
      JSON.stringify(direccion || {}),
      telefono !== undefined ? String(telefono || "").trim() : null,
      nickname,
      avatarUrl,
      geoMeta,
      userId
    )
    .run();

  return getUserById(db, userId);
}

export async function recordSearch(db, userId, search) {
  const value = String(search || "").trim();

  if (!userId || !value) {
    return;
  }

  await db.prepare("INSERT INTO search_history (user_id, busqueda) VALUES (?, ?)").bind(userId, value).run();
}

export async function recordProductView(db, userId, productId) {
  if (!userId || !productId) {
    return;
  }

  await db.prepare("INSERT INTO product_views (user_id, product_id) VALUES (?, ?)").bind(userId, productId).run();
}

export async function listProducts(db, filters = {}) {
  const clauses = [];
  const bindings = [];
  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);

  if (filters.search) {
    clauses.push("(LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ?)");
    bindings.push(`%${String(filters.search).trim().toLowerCase()}%`, `%${String(filters.search).trim().toLowerCase()}%`);
  }

  if (filters.category) {
    clauses.push("categoria = ?");
    bindings.push(filters.category);
  }

  if (filters.minPrice !== undefined && filters.minPrice !== "" && Number.isFinite(minPrice)) {
    clauses.push("precio >= ?");
    bindings.push(minPrice);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== "" && Number.isFinite(maxPrice)) {
    clauses.push("precio <= ?");
    bindings.push(maxPrice);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Number.isFinite(Number(filters.limit)) && Number(filters.limit) > 0 ? Number(filters.limit) : 24;
  const countSql = `SELECT COUNT(*) AS total FROM products ${whereClause}`;
  const itemsSql = `
    SELECT
      p.*,
      COALESCE(AVG(pc.rating), 0) AS rating_promedio,
      COUNT(pc.id) AS rating_total
    FROM products p
    LEFT JOIN product_comments pc ON pc.product_id = p.id
    ${whereClause ? whereClause.replaceAll("nombre", "p.nombre").replaceAll("descripcion", "p.descripcion").replaceAll("categoria", "p.categoria").replaceAll("precio", "p.precio") : ""}
    GROUP BY p.id
    ORDER BY p.id DESC
    LIMIT ?
  `;

  const countRow = await db.prepare(countSql).bind(...bindings).first();
  const itemsResult = await db.prepare(itemsSql).bind(...bindings, limit).all();

  return {
    items: (itemsResult.results || []).map(serializeProduct),
    pagination: {
      total: Number(countRow?.total || 0),
      limit
    }
  };
}

export async function listAdminProducts(db) {
  const result = await db
    .prepare(
      `
      SELECT
        p.*,
        COALESCE(AVG(pc.rating), 0) AS rating_promedio,
        COUNT(pc.id) AS rating_total
      FROM products p
      LEFT JOIN product_comments pc ON pc.product_id = p.id
      GROUP BY p.id
      ORDER BY p.id DESC
    `
    )
    .all();
  return (result.results || []).map(serializeProduct);
}

export async function getProductById(db, productId) {
  const row = await db
    .prepare(
      `
      SELECT
        p.*,
        COALESCE(AVG(pc.rating), 0) AS rating_promedio,
        COUNT(pc.id) AS rating_total
      FROM products p
      LEFT JOIN product_comments pc ON pc.product_id = p.id
      WHERE p.id = ? OR p.slug = ?
      GROUP BY p.id
    `
    )
    .bind(productId, String(productId || "").trim())
    .first();
  return row ? serializeProduct(row) : null;
}

export async function createProduct(db, input) {
  const nombre = String(input.nombre || "").trim();
  const descripcion = String(input.descripcion || "").trim();
  const descripcionCorta = String(input.descripcionCorta || "").trim();
  const marca = String(input.marca || "").trim();
  const categoria = String(input.categoria || "").trim().toLowerCase();
  const precio = Number(input.precio);
  const stock = Number(input.stock);
  const vendidos = Number(input.vendidos || 0);
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(input.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
  const imagenes = Array.isArray(input.imagenes)
    ? input.imagenes.map((image) => String(image).trim()).filter(Boolean)
    : String(input.imagenes || "")
        .split(/\r?\n|,/)
        .map((image) => image.trim())
        .filter(Boolean);
  const caracteristicas = Array.isArray(input.caracteristicas)
    ? input.caracteristicas.map((item) => String(item).trim()).filter(Boolean)
    : String(input.caracteristicas || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
  const envioGratis = input.envioGratis === true || input.envioGratis === "true" || input.envioGratis === "on" || Number(input.envioGratis) === 1;
  const mostrarEnvioGratis =
    input.mostrarEnvioGratis === true ||
    input.mostrarEnvioGratis === "true" ||
    input.mostrarEnvioGratis === "on" ||
    Number(input.mostrarEnvioGratis) === 1;
  const precioDescuento = Number(input.precioDescuento || 0);
  const disponibilidad = String(input.disponibilidad || (stock > 0 ? "Disponible" : "Agotado")).trim();
  const infoEnvio = String(input.infoEnvio || "").trim();
  const fechaEstimada = String(input.fechaEstimada || "").trim();
  const garantia = String(input.garantia || "").trim();
  const devolucion = String(input.devolucion || "").trim();

  if (!nombre || !descripcion || !allowedCategories.includes(categoria)) {
    throw new Error("Completa nombre, descripcion y una categoria valida.");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error("Ingresa un precio valido.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Ingresa un stock valido.");
  }
  if (!Number.isFinite(vendidos) || vendidos < 0) {
    throw new Error("Ingresa una cantidad valida de vendidos.");
  }

  if (Number.isFinite(precioDescuento) && precioDescuento < 0) {
    throw new Error("Ingresa un descuento valido.");
  }

  const baseSlug = normalizeSlug(input.slug || nombre) || `producto-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await db.prepare("SELECT id FROM products WHERE slug = ?").bind(slug).first()) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const response = await db
    .prepare(
      `
      INSERT INTO products (
        slug, nombre, descripcion, descripcion_corta, marca, precio, stock, vendidos, categoria, tags, imagenes, caracteristicas,
        disponibilidad, info_envio, fecha_estimada, garantia, devolucion, envio_gratis, mostrar_envio_gratis, precio_descuento
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      slug,
      nombre,
      descripcion,
      descripcionCorta,
      marca,
      precio,
      stock,
      vendidos,
      categoria,
      JSON.stringify(tags),
      JSON.stringify(imagenes),
      JSON.stringify(caracteristicas),
      disponibilidad,
      infoEnvio,
      fechaEstimada,
      garantia,
      devolucion,
      envioGratis ? 1 : 0,
      mostrarEnvioGratis ? 1 : 0,
      Number.isFinite(precioDescuento) && precioDescuento > 0 && precioDescuento < precio ? precioDescuento : 0
    )
    .run();

  return getProductById(db, response.meta.last_row_id);
}

export async function updateProduct(db, productId, input) {
  const existing = await getProductById(db, productId);

  if (!existing) {
    throw new Error("El producto no existe.");
  }

  const nombre = String(input.nombre ?? existing.nombre).trim();
  const descripcion = String(input.descripcion ?? existing.descripcion).trim();
  const descripcionCorta = String(input.descripcionCorta ?? existing.descripcionCorta ?? "").trim();
  const marca = String(input.marca ?? existing.marca ?? "").trim();
  const categoria = String(input.categoria ?? existing.categoria).trim().toLowerCase();
  const precio = Number(input.precio ?? existing.precio);
  const stock = Number(input.stock ?? existing.stock);
  const vendidos = Number(input.vendidos ?? existing.vendidos ?? 0);
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : input.tags !== undefined
      ? String(input.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : existing.tags;
  const imagenes = Array.isArray(input.imagenes)
    ? input.imagenes.map((image) => String(image).trim()).filter(Boolean)
    : input.imagenes !== undefined
      ? String(input.imagenes || "")
          .split(/\r?\n|,/)
          .map((image) => image.trim())
          .filter(Boolean)
      : existing.imagenes;
  const caracteristicas = Array.isArray(input.caracteristicas)
    ? input.caracteristicas.map((item) => String(item).trim()).filter(Boolean)
    : input.caracteristicas !== undefined
      ? String(input.caracteristicas || "")
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
      : existing.caracteristicas;
  const envioGratis =
    input.envioGratis !== undefined
      ? input.envioGratis === true || input.envioGratis === "true" || input.envioGratis === "on" || Number(input.envioGratis) === 1
      : existing.envioGratis;
  const mostrarEnvioGratis =
    input.mostrarEnvioGratis !== undefined
      ? input.mostrarEnvioGratis === true ||
        input.mostrarEnvioGratis === "true" ||
        input.mostrarEnvioGratis === "on" ||
        Number(input.mostrarEnvioGratis) === 1
      : existing.mostrarEnvioGratis;
  const precioDescuento = input.precioDescuento !== undefined ? Number(input.precioDescuento || 0) : Number(existing.precioDescuento || 0);
  const disponibilidad = String(input.disponibilidad ?? existing.disponibilidad ?? (stock > 0 ? "Disponible" : "Agotado")).trim();
  const infoEnvio = String(input.infoEnvio ?? existing.infoEnvio ?? "").trim();
  const fechaEstimada = String(input.fechaEstimada ?? existing.fechaEstimada ?? "").trim();
  const garantia = String(input.garantia ?? existing.garantia ?? "").trim();
  const devolucion = String(input.devolucion ?? existing.devolucion ?? "").trim();

  if (!nombre || !descripcion || !allowedCategories.includes(categoria)) {
    throw new Error("Completa nombre, descripcion y una categoria valida.");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error("Ingresa un precio valido.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Ingresa un stock valido.");
  }
  if (!Number.isFinite(vendidos) || vendidos < 0) {
    throw new Error("Ingresa una cantidad valida de vendidos.");
  }

  if (!Number.isFinite(precioDescuento) || precioDescuento < 0) {
    throw new Error("Ingresa un descuento valido.");
  }

  const incomingSlug = normalizeSlug(input.slug || nombre) || existing.slug;
  let slug = incomingSlug;
  let suffix = 1;

  while (true) {
    const duplicate = await db.prepare("SELECT id FROM products WHERE slug = ?").bind(slug).first();

    if (!duplicate || Number(duplicate.id) === Number(productId)) {
      break;
    }

    suffix += 1;
    slug = `${incomingSlug}-${suffix}`;
  }

  await db
    .prepare(
      `
      UPDATE products
      SET slug = ?, nombre = ?, descripcion = ?, descripcion_corta = ?, marca = ?, precio = ?, stock = ?, vendidos = ?, categoria = ?, tags = ?, imagenes = ?, caracteristicas = ?, disponibilidad = ?, info_envio = ?, fecha_estimada = ?, garantia = ?, devolucion = ?, envio_gratis = ?, mostrar_envio_gratis = ?, precio_descuento = ?
      WHERE id = ?
    `
    )
    .bind(
      slug,
      nombre,
      descripcion,
      descripcionCorta,
      marca,
      precio,
      stock,
      vendidos,
      categoria,
      JSON.stringify(tags),
      JSON.stringify(imagenes),
      JSON.stringify(caracteristicas),
      disponibilidad,
      infoEnvio,
      fechaEstimada,
      garantia,
      devolucion,
      envioGratis ? 1 : 0,
      mostrarEnvioGratis ? 1 : 0,
      precioDescuento > 0 && precioDescuento < precio ? precioDescuento : 0,
      productId
    )
    .run();

  return getProductById(db, productId);
}

export async function deleteProduct(db, productId) {
  await db.prepare("DELETE FROM cart_items WHERE product_id = ?").bind(productId).run();
  await db.prepare("DELETE FROM product_views WHERE product_id = ?").bind(productId).run();
  await db.prepare("DELETE FROM products WHERE id = ?").bind(productId).run();
}

export async function clearAllProducts(db) {
  await db.prepare("DELETE FROM cart_items").run();
  await db.prepare("DELETE FROM product_views").run();
  await db.prepare("DELETE FROM products").run();
}

export async function setCartItem(db, userId, productId, cantidad, options = {}) {
  const nextQuantity = Number(cantidad || 0);
  const increment = Boolean(options.increment);

  if (nextQuantity <= 0) {
    await db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?").bind(userId, productId).run();
    return;
  }

  const existing = await db.prepare("SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?").bind(userId, productId).first();

  if (existing) {
    if (increment) {
      await db
        .prepare("UPDATE cart_items SET cantidad = cantidad + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?")
        .bind(nextQuantity, userId, productId)
        .run();
      return;
    }

    await db
      .prepare("UPDATE cart_items SET cantidad = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?")
      .bind(nextQuantity, userId, productId)
      .run();
    return;
  }

  await db.prepare("INSERT INTO cart_items (user_id, product_id, cantidad) VALUES (?, ?, ?)").bind(userId, productId, nextQuantity).run();
}

export async function getCartState(db, userId) {
  const result = await db
    .prepare(
      `
      SELECT
        c.product_id AS productoId,
        c.cantidad,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.precio,
        p.precio_descuento,
        p.stock,
        p.imagenes
      FROM cart_items c
      INNER JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC, c.id DESC
    `
    )
    .bind(userId)
    .all();

  const items = (result.results || []).map((row) => {
    const precioNormal = Number(row.precio);
    const precioConDescuento = Number(row.precio_descuento || 0);
    const precio =
      Number.isFinite(precioConDescuento) && precioConDescuento > 0 && precioConDescuento < precioNormal
        ? precioConDescuento
        : precioNormal;
    const cantidad = Number(row.cantidad);

    return {
      productoId: Number(row.productoId),
      cantidad,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoria: row.categoria,
      precio,
      precioOriginal: precio !== precioNormal ? precioNormal : 0,
      subtotal: precio * cantidad,
      stock: Number(row.stock),
      imagenes: parseJson(row.imagenes, [])
    };
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0)
  };
}

export async function buildCheckoutSummary(db, userId) {
  const cart = await getCartState(db, userId);

  return {
    items: cart.items.map((item) => ({
      productoId: item.productoId,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal
    })),
    total: cart.total
  };
}

export async function createOrderFromCart(db, userId, { direccion, proveedorPago, telefono = "" }) {
  const summary = await buildCheckoutSummary(db, userId);

  if (!summary.items.length) {
    throw new Error("Tu carrito esta vacio.");
  }

  const orderId = generateOrderId();

  const initialTracking = [
    {
      title: "Pedido recibido",
      location: direccion?.ciudad || direccion?.pais || "Centro de pedidos",
      note: "Tu compra fue registrada correctamente.",
      date: new Date().toISOString(),
      completed: true
    }
  ];

  await db
    .prepare(
      `
      INSERT INTO orders (id, user_id, total, estado, proveedor_pago, direccion, tracking)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      orderId,
      userId,
      summary.total,
      "pending_payment",
      proveedorPago,
      JSON.stringify(direccion || {}),
      JSON.stringify(initialTracking)
    )
    .run();

  for (const item of summary.items) {
    await db
      .prepare(
        `
        INSERT INTO order_items (order_id, product_id, nombre, precio, cantidad, estado, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
      .bind(orderId, item.productoId, item.nombre, item.precio, item.cantidad, "pendiente")
      .run();
  }

  await updateUserAddress(db, userId, direccion, telefono);
  await clearCart(db, userId);

  return {
    order: {
      id: orderId,
      total: summary.total,
        estado: "pending_payment",
        proveedorPago,
        tracking: initialTracking,
        items: summary.items
      }
  };
}

export async function getOrderById(db, orderId) {
  return db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
}

export async function getOrderWithItems(db, orderId) {
  const order = await getOrderById(db, orderId);

  if (!order) {
    return null;
  }

  const items = await db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC").bind(orderId).all();

  return {
    ...order,
    total: Number(order.total),
    direccion: parseJson(order.direccion, {}),
    tracking: parseJson(order.tracking, []),
    items: (items.results || []).map((item) => ({
      id: Number(item.id),
      productoId: Number(item.product_id),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      estado: item.estado || "pendiente"
    }))
  };
}

export async function savePaymentRecord(db, { orderId, provider, status, externalId = "", approvalUrl = "", payload = "" }) {
  const existing = await db.prepare("SELECT id FROM payments WHERE order_id = ? AND provider = ?").bind(orderId, provider).first();

  if (existing) {
    await db
      .prepare(
        `
        UPDATE payments
        SET status = ?, external_id = ?, approval_url = ?, payload = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .bind(status, externalId, approvalUrl, payload, existing.id)
      .run();
    return;
  }

  await db
    .prepare(
      `
      INSERT INTO payments (order_id, provider, status, external_id, approval_url, payload)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .bind(orderId, provider, status, externalId, approvalUrl, payload)
    .run();
}

export async function markOrderStatus(db, orderId, status, paymentReference = "") {
  await db
    .prepare(
      `
      UPDATE orders
      SET estado = ?, payment_reference = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
    .bind(status, paymentReference, orderId)
    .run();
}

export async function clearCart(db, userId) {
  await db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(userId).run();
}

export async function decrementStockForOrder(db, orderId) {
  const items = await db.prepare("SELECT product_id, cantidad FROM order_items WHERE order_id = ?").bind(orderId).all();

  for (const item of items.results || []) {
    await db
      .prepare(
        `
        UPDATE products
        SET stock = CASE
          WHEN stock - ? < 0 THEN 0
          ELSE stock - ?
        END
        WHERE id = ?
      `
      )
      .bind(Number(item.cantidad), Number(item.cantidad), Number(item.product_id))
      .run();
  }
}

export async function getUserDashboard(db, userId) {
  const user = await getUserById(db, userId);
  const orders = await db
    .prepare("SELECT id, total, estado, tracking, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
    .bind(userId)
    .all();
  const orderRows = orders.results || [];
  const orderItems = orderRows.length
    ? await db
        .prepare(
          `
          SELECT id, order_id, product_id, nombre, precio, cantidad, estado
          FROM order_items
          WHERE order_id IN (${orderRows.map(() => "?").join(",")})
          ORDER BY id ASC
        `
        )
        .bind(...orderRows.map((order) => order.id))
        .all()
    : { results: [] };
  const itemsByOrder = new Map();

  for (const item of orderItems.results || []) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push({
      id: Number(item.id),
      productoId: Number(item.product_id),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      estado: item.estado || "pendiente"
    });
    itemsByOrder.set(item.order_id, list);
  }
  const searches = await db
    .prepare("SELECT busqueda, fecha FROM search_history WHERE user_id = ? ORDER BY fecha DESC LIMIT 10")
    .bind(userId)
    .all();
  const views = await db
    .prepare(
      `
      SELECT pv.fecha, p.nombre
      FROM product_views pv
      INNER JOIN products p ON p.id = pv.product_id
      WHERE pv.user_id = ?
      ORDER BY pv.fecha DESC
      LIMIT 10
    `
    )
    .bind(userId)
    .all();

  return {
    user: serializeUser(user),
    historial: {
      ordenes: orderRows.map((item) => ({
        id: item.id,
        total: Number(item.total),
        estado: item.estado,
        tracking: parseJson(item.tracking, []),
        fecha: item.created_at,
        items: itemsByOrder.get(item.id) || []
      })),
      busquedas: (searches.results || []).map((item) => ({
        id: `${item.fecha}-${item.busqueda}`,
        busqueda: item.busqueda,
        fecha: item.fecha
      })),
      productosVistos: (views.results || []).map((item) => ({
        id: `${item.fecha}-${item.nombre}`,
        fecha: item.fecha,
        producto: {
          nombre: item.nombre,
          slug: normalizeSlug(item.nombre)
        }
      })),
      favoritos: []
    }
  };
}

export async function listAdminOrders(db) {
  const orders = await db
    .prepare(
      `
      SELECT o.*, u.nombre AS usuario_nombre, u.email AS usuario_email, u.telefono AS usuario_telefono
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 80
    `
    )
    .all();
  const orderRows = orders.results || [];

  if (!orderRows.length) {
    return [];
  }

  const items = await db
    .prepare(
      `
      SELECT oi.*
      FROM order_items oi
      WHERE oi.order_id IN (${orderRows.map(() => "?").join(",")})
      ORDER BY oi.id ASC
    `
    )
    .bind(...orderRows.map((order) => order.id))
    .all();
  const itemsByOrder = new Map();

  for (const item of items.results || []) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push({
      id: Number(item.id),
      productoId: Number(item.product_id),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad),
      estado: item.estado || "pendiente"
    });
    itemsByOrder.set(item.order_id, list);
  }

  return orderRows.map((order) => ({
    id: order.id,
    userId: Number(order.user_id),
    usuarioNombre: order.usuario_nombre,
    usuarioEmail: order.usuario_email,
    usuarioTelefono: order.usuario_telefono || "",
    total: Number(order.total),
    estado: order.estado,
    proveedorPago: order.proveedor_pago,
    direccion: parseJson(order.direccion, {}),
    tracking: parseJson(order.tracking, []),
    fecha: order.created_at,
    items: itemsByOrder.get(order.id) || []
  }));
}

export async function listAdminCarts(db) {
  const result = await db
    .prepare(
      `
      SELECT
        u.id AS user_id,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email,
        c.product_id,
        c.cantidad,
        c.updated_at,
        p.nombre,
        p.precio
      FROM cart_items c
      INNER JOIN users u ON u.id = c.user_id
      INNER JOIN products p ON p.id = c.product_id
      ORDER BY c.updated_at DESC
    `
    )
    .all();
  const carts = new Map();

  for (const row of result.results || []) {
    const userId = Number(row.user_id);
    const cart = carts.get(userId) || {
      userId,
      usuarioNombre: row.usuario_nombre,
      usuarioEmail: row.usuario_email,
      items: [],
      total: 0
    };
    const subtotal = Number(row.precio) * Number(row.cantidad);

    cart.items.push({
      productoId: Number(row.product_id),
      nombre: row.nombre,
      precio: Number(row.precio),
      cantidad: Number(row.cantidad),
      subtotal,
      actualizado: row.updated_at
    });
    cart.total += subtotal;
    carts.set(userId, cart);
  }

  return Array.from(carts.values());
}

export async function listAdminUsers(db) {
  const users = await db
    .prepare(
      `
      SELECT id, nombre, email, telefono, nickname, avatar_url, direccion, is_active, created_at
      FROM users
      WHERE role != 'admin'
      ORDER BY created_at DESC
      LIMIT 200
    `
    )
    .all();

  return (users.results || []).map((user) => ({
    id: Number(user.id),
    nombre: user.nombre,
    email: user.email,
    telefono: user.telefono || "",
    nickname: user.nickname || "",
    avatarUrl: user.avatar_url || "",
    isActive: Boolean(Number(user.is_active ?? 1)),
    direccion: parseJson(user.direccion, {}),
    fechaRegistro: user.created_at
  }));
}

export async function getAdminUserDetail(db, userId) {
  const user = await getUserById(db, Number(userId));

  if (!user) {
    return null;
  }

  const dashboard = await getUserDashboard(db, Number(userId));
  const cart = await getCartState(db, Number(userId));

  return {
    user: serializeUser(user),
    historial: dashboard.historial,
    cart
  };
}

export async function setUserActiveStatus(db, userId, isActive) {
  const targetId = Number(userId || 0);
  if (!targetId) {
    throw new Error("Usuario invalido.");
  }

  await db
    .prepare(
      `
      UPDATE users
      SET is_active = ?
      WHERE id = ? AND role != 'admin'
    `
    )
    .bind(isActive ? 1 : 0, targetId)
    .run();

  return getUserById(db, targetId);
}

export async function updateOrderItemStatus(db, itemId, estado) {
  const allowed = ["pendiente", "comprado"];
  const nextStatus = allowed.includes(String(estado || "")) ? estado : "pendiente";

  await db
    .prepare("UPDATE order_items SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(nextStatus, Number(itemId))
    .run();

  const row = await db.prepare("SELECT order_id FROM order_items WHERE id = ?").bind(Number(itemId)).first();

  if (row?.order_id) {
    const pending = await db
      .prepare("SELECT COUNT(*) AS total FROM order_items WHERE order_id = ? AND estado != 'comprado'")
      .bind(row.order_id)
      .first();

    if (!Number(pending?.total || 0)) {
      await markOrderStatus(db, row.order_id, "paid", "whatsapp");
    }
  }

  return { ok: true };
}

export async function updateOrderTracking(db, orderId, tracking) {
  const normalized = Array.isArray(tracking)
    ? tracking
        .map((item) => ({
          title: String(item?.title || "").trim(),
          location: String(item?.location || "").trim(),
          note: String(item?.note || "").trim(),
          date: String(item?.date || "").trim(),
          completed: Boolean(item?.completed)
        }))
        .filter((item) => item.title || item.location || item.note || item.date)
    : [];

  await db
    .prepare("UPDATE orders SET tracking = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(JSON.stringify(normalized), String(orderId || "").trim())
    .run();

  return { ok: true, tracking: normalized };
}

export async function updateOrderStatus(db, orderId, estado) {
  const allowed = ["pending_payment", "paid", "cancelled"];
  const next = allowed.includes(String(estado || "").trim()) ? String(estado || "").trim() : "pending_payment";

  await db
    .prepare("UPDATE orders SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(next, String(orderId || "").trim())
    .run();

  return { ok: true, estado: next };
}

export async function deleteOrder(db, orderId) {
  const order = await getOrderById(db, orderId);

  if (!order) {
    return { ok: true };
  }

  if (!["pending_payment", "cancelled"].includes(String(order.estado || ""))) {
    throw new Error("Solo puedes eliminar pedidos en espera o cancelados.");
  }

  await db.prepare("DELETE FROM payments WHERE order_id = ?").bind(orderId).run();
  await db.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId).run();
  await db.prepare("DELETE FROM orders WHERE id = ?").bind(orderId).run();
  return { ok: true };
}

export async function canUserCommentOnProduct(db, userId, productId) {
  const purchase = await db
    .prepare(
      `
      SELECT oi.id
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND oi.estado = 'comprado'
      LIMIT 1
    `
    )
    .bind(Number(userId), Number(productId))
    .first();

  return Boolean(purchase);
}

export async function listProductComments(db, productId) {
  const result = await db
    .prepare(
      `
      SELECT pc.*, u.nombre, u.nickname, u.avatar_url
      FROM product_comments pc
      INNER JOIN users u ON u.id = pc.user_id
      WHERE pc.product_id = ?
      ORDER BY pc.created_at DESC
      LIMIT 30
    `
    )
    .bind(Number(productId))
    .all();

  return (result.results || []).map((comment) => ({
    id: Number(comment.id),
    productId: Number(comment.product_id),
    userId: Number(comment.user_id),
    usuario: comment.nombre,
    nickname: comment.nickname || "",
    avatarUrl: comment.avatar_url || "",
    rating: Number(comment.rating),
    comentario: comment.comentario,
    fecha: comment.created_at
  }));
}

export async function createProductComment(db, userId, productId, input) {
  const rating = Number(input.rating);
  const comentario = String(input.comentario || "").trim();

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Selecciona una calificacion de 1 a 5 estrellas.");
  }

  if (comentario.length < 3) {
    throw new Error("Escribe un comentario un poco mas completo.");
  }

  if (!(await canUserCommentOnProduct(db, userId, productId))) {
    throw new Error("Podras comentar cuando tu compra este confirmada.");
  }

  await db
    .prepare("INSERT INTO product_comments (product_id, user_id, rating, comentario) VALUES (?, ?, ?, ?)")
    .bind(Number(productId), Number(userId), rating, comentario)
    .run();

  return listProductComments(db, productId);
}

export async function deleteProductComment(db, commentId) {
  const id = Number(commentId);

  if (!Number.isFinite(id)) {
    throw new Error("Comentario invalido.");
  }

  await db.prepare("DELETE FROM product_comments WHERE id = ?").bind(id).run();
  return { ok: true };
}

export async function getSiteContent(db) {
  const result = await db.prepare("SELECT clave, valor FROM site_content").all();
  const content = structuredClone(defaultSiteContent);

  for (const row of result.results || []) {
    const parsed = parseJson(row.valor, Array.isArray(defaultSiteContent[row.clave]) ? [] : {});
    content[row.clave] = Array.isArray(defaultSiteContent[row.clave])
      ? (Array.isArray(parsed) ? parsed : [])
      : {
          ...(content[row.clave] || {}),
          ...(parsed && typeof parsed === "object" ? parsed : {})
        };
  }

  return content;
}

export async function updateSiteContent(db, sectionKey, input) {
  const key = String(sectionKey || "").trim();

  if (!Object.prototype.hasOwnProperty.call(defaultSiteContent, key)) {
    throw new Error("La seccion que intentas editar no existe.");
  }

  const nextValue = Array.isArray(defaultSiteContent[key])
    ? (Array.isArray(input) ? input : [])
    : {
        ...defaultSiteContent[key],
        ...(input && typeof input === "object" ? input : {})
      };

  await db
    .prepare(
      `
      INSERT INTO site_content (clave, valor, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(clave) DO UPDATE SET
        valor = excluded.valor,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .bind(key, JSON.stringify(nextValue))
    .run();

  return nextValue;
}
