import { hashPassword } from "./security.js";

const seedProducts = [
  {
    slug: "chatgpt-plus-anual",
    nombre: "ChatGPT Plus anual",
    descripcion: "Suscripcion premium para productividad, redaccion, analisis y automatizacion diaria.",
    precio: 3499,
    stock: 100,
    categoria: "apps",
    tags: ["ia", "chat", "productividad"],
    imagenes: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"]
  },
  {
    slug: "notion-ai-business",
    nombre: "Notion AI Business",
    descripcion: "Espacio de trabajo con inteligencia artificial para documentacion, planeacion y equipos.",
    precio: 2899,
    stock: 80,
    categoria: "apps",
    tags: ["notion", "workspace", "ia"],
    imagenes: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80"]
  },
  {
    slug: "pack-creador-pro",
    nombre: "Pack Creador Pro",
    descripcion: "Bundle de herramientas premium para edicion, copies, thumbnails y estrategia de contenido.",
    precio: 7999,
    stock: 40,
    categoria: "packs",
    tags: ["pack", "creadores", "contenido"],
    imagenes: ["https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=900&q=80"]
  },
  {
    slug: "pack-agencia-ventas",
    nombre: "Pack Agencia Ventas",
    descripcion: "Suite de herramientas para prospeccion, automatizacion comercial y seguimiento de clientes.",
    precio: 9999,
    stock: 35,
    categoria: "packs",
    tags: ["ventas", "crm", "automatizacion"],
    imagenes: ["https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80"]
  },
  {
    slug: "landing-premium-ia",
    nombre: "Landing premium con IA",
    descripcion: "Servicio web para lanzar una pagina de ventas optimizada con copy, estructura y secciones listas.",
    precio: 24900,
    stock: 20,
    categoria: "webs",
    tags: ["landing", "web", "ventas"],
    imagenes: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80"]
  },
  {
    slug: "tienda-web-completa",
    nombre: "Tienda web completa",
    descripcion: "Implementacion de tienda online con catalogo, carrito, checkout y administracion basica.",
    precio: 59900,
    stock: 10,
    categoria: "webs",
    tags: ["ecommerce", "tienda", "desarrollo"],
    imagenes: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"]
  }
];

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

export async function getProductById(db, productId) {
  const row = await db.prepare("SELECT * FROM products WHERE id = ?").bind(productId).first();
  return row ? serializeProduct(row) : null;
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
