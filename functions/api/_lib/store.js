import { hashPassword } from "./security.js";

const seedProducts = [];
const defaultSiteContent = {
  home: {
    topStrip: "Pagos seguros, acceso privado y garantia en cada compra",
    heroEyebrow: "Marketplace digital",
    heroTitle: "Compra suscripciones, herramientas IA y servicios web desde una sola tienda.",
    heroDescription:
      "Una vitrina limpia y clara para encontrar productos digitales, comprar con confianza y volver cuando quieras.",
    primaryButton: "Ver catalogo",
    secondaryButton: "Crear cuenta",
    categoriesLabel: "Explora rapido",
    categoriesTitle: "Categorias destacadas",
    featuredLabel: "Top productos",
    featuredTitle: "Lo mas vendido",
    infoOneTitle: "Catalogo con busqueda y filtros",
    infoOneText: "Tus clientes encuentran rapido lo que quieren y guardan sus favoritos en su cuenta.",
    infoTwoTitle: "Cuenta privada y segura",
    infoTwoText: "Cada compra, historial y direccion queda guardado dentro del perfil del usuario.",
    infoThreeTitle: "Pagos y control total",
    infoThreeText: "Vende desde una sola tienda y administra tu contenido desde el panel interno."
  },
  catalog: {
    topStrip: "Encuentra productos digitales con pagos seguros y compra protegida",
    label: "Catalogo",
    title: "Encuentra el producto ideal",
    description: "Descubre apps IA, packs y servicios web desde un solo lugar.",
    resultsLabel: "Resultados",
    allMeta: "Mostrando todo el catalogo"
  }
};

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL DEFAULT 'customer',
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
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
      categoria TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      imagenes TEXT NOT NULL DEFAULT '[]',
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
    direccion: parseJson(row.direccion, {})
  };
}

export function serializeProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    stock: Number(row.stock),
    categoria: row.categoria,
    tags: parseJson(row.tags, []),
    imagenes: parseJson(row.imagenes, [])
  };
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

  if (!existingAdmin) {
    const passwordHash = await hashPassword(getAdminPassword(env));

    await db
      .prepare(
        `
        INSERT INTO users (role, nombre, email, password_hash, direccion)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .bind(
        "admin",
        "Administrador MarketZone",
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

export async function createUser(db, { nombre, email, passwordHash }) {
  const response = await db
    .prepare(
      `
      INSERT INTO users (nombre, email, password_hash, direccion)
      VALUES (?, ?, ?, ?)
    `
    )
    .bind(nombre, String(email).trim().toLowerCase(), passwordHash, JSON.stringify({}))
    .run();

  return getUserById(db, response.meta.last_row_id);
}

export async function updateUserAddress(db, userId, direccion) {
  await db
    .prepare(
      `
      UPDATE users
      SET direccion = ?
      WHERE id = ?
    `
    )
    .bind(JSON.stringify(direccion || {}), userId)
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
    SELECT *
    FROM products
    ${whereClause}
    ORDER BY id DESC
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
  const result = await db.prepare("SELECT * FROM products ORDER BY id DESC").all();
  return (result.results || []).map(serializeProduct);
}

export async function getProductById(db, productId) {
  const row = await db.prepare("SELECT * FROM products WHERE id = ?").bind(productId).first();
  return row ? serializeProduct(row) : null;
}

export async function createProduct(db, input) {
  const nombre = String(input.nombre || "").trim();
  const descripcion = String(input.descripcion || "").trim();
  const categoria = String(input.categoria || "").trim().toLowerCase();
  const precio = Number(input.precio);
  const stock = Number(input.stock);
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

  if (!nombre || !descripcion || !["apps", "packs", "webs"].includes(categoria)) {
    throw new Error("Completa nombre, descripcion y una categoria valida.");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error("Ingresa un precio valido.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Ingresa un stock valido.");
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
      INSERT INTO products (slug, nombre, descripcion, precio, stock, categoria, tags, imagenes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(slug, nombre, descripcion, precio, stock, categoria, JSON.stringify(tags), JSON.stringify(imagenes))
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
  const categoria = String(input.categoria ?? existing.categoria).trim().toLowerCase();
  const precio = Number(input.precio ?? existing.precio);
  const stock = Number(input.stock ?? existing.stock);
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

  if (!nombre || !descripcion || !["apps", "packs", "webs"].includes(categoria)) {
    throw new Error("Completa nombre, descripcion y una categoria valida.");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    throw new Error("Ingresa un precio valido.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Ingresa un stock valido.");
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
      SET slug = ?, nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria = ?, tags = ?, imagenes = ?
      WHERE id = ?
    `
    )
    .bind(slug, nombre, descripcion, precio, stock, categoria, JSON.stringify(tags), JSON.stringify(imagenes), productId)
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

export async function setCartItem(db, userId, productId, cantidad) {
  const nextQuantity = Number(cantidad || 0);

  if (nextQuantity <= 0) {
    await db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?").bind(userId, productId).run();
    return;
  }

  const existing = await db.prepare("SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?").bind(userId, productId).first();

  if (existing) {
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
    const precio = Number(row.precio);
    const cantidad = Number(row.cantidad);

    return {
      productoId: Number(row.productoId),
      cantidad,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoria: row.categoria,
      precio,
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

export async function createOrderFromCart(db, userId, { direccion, proveedorPago }) {
  const summary = await buildCheckoutSummary(db, userId);

  if (!summary.items.length) {
    throw new Error("Tu carrito esta vacio.");
  }

  const orderId = generateOrderId();

  await db
    .prepare(
      `
      INSERT INTO orders (id, user_id, total, estado, proveedor_pago, direccion)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .bind(orderId, userId, summary.total, "pending_payment", proveedorPago, JSON.stringify(direccion || {}))
    .run();

  for (const item of summary.items) {
    await db
      .prepare(
        `
        INSERT INTO order_items (order_id, product_id, nombre, precio, cantidad)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .bind(orderId, item.productoId, item.nombre, item.precio, item.cantidad)
      .run();
  }

  await updateUserAddress(db, userId, direccion);

  return {
    order: {
      id: orderId,
      total: summary.total,
      estado: "pending_payment",
      proveedorPago
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
    items: (items.results || []).map((item) => ({
      productoId: Number(item.product_id),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad)
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
    .prepare("SELECT id, total, estado, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
    .bind(userId)
    .all();
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
      ordenes: (orders.results || []).map((item) => ({
        id: item.id,
        total: Number(item.total),
        estado: item.estado,
        fecha: item.created_at
      })),
      busquedas: (searches.results || []).map((item) => ({
        busqueda: item.busqueda,
        fecha: item.fecha
      })),
      productosVistos: (views.results || []).map((item) => ({
        fecha: item.fecha,
        producto: {
          nombre: item.nombre
        }
      }))
    }
  };
}

export async function getSiteContent(db) {
  const result = await db.prepare("SELECT clave, valor FROM site_content").all();
  const content = structuredClone(defaultSiteContent);

  for (const row of result.results || []) {
    content[row.clave] = {
      ...(content[row.clave] || {}),
      ...parseJson(row.valor, {})
    };
  }

  return content;
}

export async function updateSiteContent(db, sectionKey, input) {
  const key = String(sectionKey || "").trim();

  if (!Object.prototype.hasOwnProperty.call(defaultSiteContent, key)) {
    throw new Error("La seccion que intentas editar no existe.");
  }

  const nextValue = {
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
